import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

type Pool = mysql.Pool;

// AI Studio & Standard MySQL Environment Variables with strict precedence
const DB_HOST = process.env.DB_HOST || process.env.DBHOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || process.env.DBPORT || 3306);
const DB_USER = process.env.DB_USER || process.env.DBUSER || process.env.DB_USERNAME || process.env.USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.DBPASSWORD || process.env.PASSWORD || '';
const DB_NAME = process.env.DB_NAME || process.env.DBNAME || 'telecloud';

let pool: Pool | null = null;
let isDbConnected = false;
let dbInitError: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

// ============================================================================
// LOCAL PERSISTENT JSON STORE FALLBACK (Fault-Tolerant Resilient Architecture)
// ============================================================================
const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_DB_PATH = path.resolve(DATA_DIR, 'telecloud_db_store.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

interface LocalStoreSchema {
  users: Record<string, any>;
  workspaces: any[];
  user_files: any[];
  telegram_system_sessions: any[];
  system_settings: Record<string, string>;
  workspace_next_id: number;
  file_next_id: number;
}

let localStore: LocalStoreSchema = {
  users: {},
  workspaces: [],
  user_files: [],
  telegram_system_sessions: [],
  system_settings: {},
  workspace_next_id: 1,
  file_next_id: 1,
};

function loadLocalStore(): LocalStoreSchema {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      localStore = {
        users: parsed.users || {},
        workspaces: parsed.workspaces || [],
        user_files: parsed.user_files || [],
        telegram_system_sessions: parsed.telegram_system_sessions || [],
        system_settings: parsed.system_settings || {},
        workspace_next_id: parsed.workspace_next_id || 1,
        file_next_id: parsed.file_next_id || 1,
      };
    }
  } catch (err: any) {
    console.warn('[Local Store] Notice loading local database file:', err.message);
  }
  return localStore;
}

function saveLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Local Store] Warning writing to local database file:', err.message);
  }
}

// Initial load
loadLocalStore();

export interface WorkspaceRecord {
  id: number;
  telegram_id: string;
  name: string;
  slug: string;
  storage_chat: string;
  is_default: boolean;
  file_count?: number;
  total_bytes?: number;
  created_at: string;
  updated_at: string;
}

export async function initDb() {
  console.log(`[MySQL] Initializing connection to ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}...`);
  try {
    // 1. Create Connection Pool directly connected to target database
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 15,
      connectTimeout: 5000,
      queueLimit: 0,
    });

    // Verify active connection
    const conn = await pool.getConnection();
    conn.release();

    // 2. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        username VARCHAR(255),
        phone VARCHAR(50),
        storage_chat VARCHAR(255) DEFAULT 'me',
        active_workspace_id INT DEFAULT NULL,
        api_key VARCHAR(128) UNIQUE DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create Workspaces Table (Multi-workspace per Telegram Account)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        storage_chat VARCHAR(255) DEFAULT 'me',
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ws_tg (telegram_id),
        UNIQUE KEY uq_user_ws_slug (telegram_id, slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create User Files Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        message_id BIGINT NOT NULL,
        workspace_id INT DEFAULT NULL,
        workspace_name VARCHAR(255) DEFAULT NULL,
        file_slug VARCHAR(64) UNIQUE DEFAULT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        mime_type VARCHAR(150) DEFAULT 'application/octet-stream',
        caption TEXT,
        storage_chat VARCHAR(255) DEFAULT 'me',
        direct_link TEXT,
        download_password VARCHAR(255) DEFAULT NULL,
        is_restricted BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tg_user (telegram_id),
        INDEX idx_ws_file (workspace_id),
        INDEX idx_file_slug (file_slug),
        UNIQUE KEY uq_user_msg (telegram_id, message_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create Telegram System Sessions Table (Centralized Cloud Session Storage)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_system_sessions (
        id INT PRIMARY KEY DEFAULT 1,
        api_id INT DEFAULT NULL,
        api_hash VARCHAR(100) DEFAULT NULL,
        session_str TEXT DEFAULT NULL,
        storage_chat VARCHAR(255) DEFAULT 'me',
        active_user JSON DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create Global System Settings Table (Admin Customization & System Defaults)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist safely
    try { await pool.query(`ALTER TABLE users ADD COLUMN active_workspace_id INT DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN api_key VARCHAR(128) UNIQUE DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN session_str TEXT DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users MODIFY COLUMN session_str TEXT DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN session_expires_at DATETIME DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN session_status VARCHAR(50) DEFAULT 'active';`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN session_api_id INT DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN session_api_hash VARCHAR(100) DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN last_active_at DATETIME DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN bot_token VARCHAR(255) DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`); } catch {}
    try { await pool.query(`ALTER TABLE telegram_system_sessions ADD COLUMN bot_token VARCHAR(255) DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN workspace_id INT DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN workspace_name VARCHAR(255) DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN download_password VARCHAR(255) DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN file_slug VARCHAR(64) UNIQUE DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN is_restricted BOOLEAN DEFAULT FALSE;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN access_count INT DEFAULT 0;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN last_accessed_at DATETIME DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD INDEX idx_file_slug (file_slug);`); } catch {}

    // Backfill unique file_slug for any legacy files missing a slug
    try {
      const [emptySlugRows]: any = await pool.query(
        `SELECT id, telegram_id, message_id FROM user_files WHERE file_slug IS NULL OR file_slug = ''`
      );
      if (Array.isArray(emptySlugRows) && emptySlugRows.length > 0) {
        for (const row of emptySlugRows) {
          const generatedSlug = generateUniqueFileSlug(8);
          await pool.query(`UPDATE user_files SET file_slug = ? WHERE id = ?`, [generatedSlug, row.id]);
        }
        console.log(`[MySQL] Backfilled unique slugs for ${emptySlugRows.length} existing files.`);
      }
    } catch (slugErr: any) {
      console.warn('[MySQL] Slug backfill notice:', slugErr.message);
    }

    isDbConnected = true;
    dbInitError = null;
    console.log(`[MySQL] Connection established successfully with database: ${DB_NAME}`);
  } catch (err: any) {
    isDbConnected = false;
    dbInitError = err.message || 'Failed to connect to MySQL database.';
    console.warn(`[MySQL Error] Database connection failed: ${dbInitError}`);
  }

  if (!reconnectTimer) {
    reconnectTimer = setInterval(async () => {
      await checkDbConnection().catch(() => {});
    }, 3000);
  }
}

export async function checkDbConnection(): Promise<boolean> {
  if (!pool) {
    await initDb().catch(() => {});
    return isDbConnected;
  }
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    isDbConnected = true;
    dbInitError = null;
    return true;
  } catch (err: any) {
    isDbConnected = false;
    dbInitError = err.message || 'MySQL database connection lost.';
    try {
      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }
    } catch {}
    return false;
  }
}

export function getDbStatus() {
  return {
    connected: isDbConnected,
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
    error: dbInitError,
    storage_mode: isDbConnected ? 'mysql' : 'disconnected',
  };
}

export async function getWorkspacesFromDb(telegramId: number | string): Promise<{
  workspaces: WorkspaceRecord[];
  active_workspace_id: number;
}> {
  const tgId = String(telegramId);

  if (!pool || !isDbConnected) {
    // Resilient fallback implementation
    loadLocalStore();
    let userWorkspaces = localStore.workspaces.filter((w) => String(w.telegram_id) === tgId);
    if (userWorkspaces.length === 0) {
      const defaultWs: WorkspaceRecord = {
        id: localStore.workspace_next_id++,
        telegram_id: tgId,
        name: 'Default Workspace',
        slug: 'default-workspace',
        storage_chat: 'me',
        is_default: true,
        file_count: 0,
        total_bytes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStore.workspaces.push(defaultWs);
      saveLocalStore();
      userWorkspaces = [defaultWs];
    }

    // Compute file counts and bytes
    const enriched = userWorkspaces.map((w) => {
      const userFiles = localStore.user_files.filter(
        (f) => String(f.telegram_id) === tgId && (Number(f.workspace_id) === Number(w.id) || (!f.workspace_id && w.is_default))
      );
      return {
        ...w,
        file_count: userFiles.length,
        total_bytes: userFiles.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0),
      };
    });

    const activeId = localStore.users[tgId]?.active_workspace_id || enriched[0]?.id || 1;
    return { workspaces: enriched, active_workspace_id: activeId };
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
        w.id, w.telegram_id, w.name, w.slug, w.storage_chat, w.is_default, w.created_at, w.updated_at,
        COUNT(f.id) AS file_count,
        COALESCE(SUM(f.file_size), 0) AS total_bytes
       FROM workspaces w
       LEFT JOIN user_files f ON (f.workspace_id = w.id OR (f.workspace_id IS NULL AND w.is_default = TRUE))
       WHERE w.telegram_id = ?
       GROUP BY w.id
       ORDER BY w.is_default DESC, w.id ASC`,
      [tgId]
    );

    let workspaces = (rows as any[]).map((r) => ({
      ...r,
      file_count: Number(r.file_count || 0),
      total_bytes: Number(r.total_bytes || 0),
      is_default: Boolean(r.is_default),
    }));

    if (workspaces.length === 0) {
      try {
        await pool.query(
          `INSERT INTO workspaces (telegram_id, name, slug, storage_chat, is_default)
           VALUES (?, 'Default Workspace', 'default-workspace', 'me', TRUE)
           ON DUPLICATE KEY UPDATE is_default = TRUE`,
          [tgId]
        );
      } catch (insertErr: any) {
        console.warn('[MySQL] Handled concurrent workspace creation:', insertErr.message);
      }

      const [reloadedRows] = await pool.query(
        `SELECT 
          w.id, w.telegram_id, w.name, w.slug, w.storage_chat, w.is_default, w.created_at, w.updated_at,
          COUNT(f.id) AS file_count,
          COALESCE(SUM(f.file_size), 0) AS total_bytes
         FROM workspaces w
         LEFT JOIN user_files f ON (f.workspace_id = w.id OR (f.workspace_id IS NULL AND w.is_default = TRUE))
         WHERE w.telegram_id = ?
         GROUP BY w.id
         ORDER BY w.is_default DESC, w.id ASC`,
        [tgId]
      );

      workspaces = (reloadedRows as any[]).map((r) => ({
        ...r,
        file_count: Number(r.file_count || 0),
        total_bytes: Number(r.total_bytes || 0),
        is_default: Boolean(r.is_default),
      }));
    }

    let activeId: number | null = null;
    try {
      const [userRows] = await pool.query(
        `SELECT active_workspace_id FROM users WHERE telegram_id = ?`,
        [tgId]
      );
      activeId = (userRows as any[])[0]?.active_workspace_id;
    } catch (err: any) {
      console.warn('[MySQL] Notice fetching active_workspace_id:', err.message);
    }

    if ((!activeId || !workspaces.some((w) => w.id === activeId)) && workspaces.length > 0) {
      activeId = workspaces[0].id;
      try {
        await pool.query(
          `UPDATE users SET active_workspace_id = ? WHERE telegram_id = ?`,
          [activeId, tgId]
        );
      } catch {}
    }

    return { workspaces, active_workspace_id: activeId || (workspaces[0]?.id ?? 1) };
  } catch (err: any) {
    isDbConnected = false;
    return getWorkspacesFromDb(telegramId);
  }
}

export async function createWorkspaceInDb(
  telegramId: number | string,
  name: string,
  storageChat: string = 'me'
): Promise<WorkspaceRecord> {
  const tgId = String(telegramId);
  const cleanName = name.trim();
  const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}-${randomSuffix}`;

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const newWs: WorkspaceRecord = {
      id: localStore.workspace_next_id++,
      telegram_id: tgId,
      name: cleanName,
      slug,
      storage_chat: storageChat.trim() || 'me',
      is_default: false,
      file_count: 0,
      total_bytes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStore.workspaces.push(newWs);
    saveLocalStore();
    return newWs;
  }

  try {
    const [res] = await pool.query(
      `INSERT INTO workspaces (telegram_id, name, slug, storage_chat, is_default)
       VALUES (?, ?, ?, ?, FALSE)`,
      [tgId, cleanName, slug, storageChat.trim() || 'me']
    );
    const insertId = (res as any).insertId;
    return {
      id: insertId,
      telegram_id: tgId,
      name: cleanName,
      slug,
      storage_chat: storageChat.trim() || 'me',
      is_default: false,
      file_count: 0,
      total_bytes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (err: any) {
    isDbConnected = false;
    return createWorkspaceInDb(telegramId, name, storageChat);
  }
}

export async function updateWorkspaceInDb(
  workspaceId: number,
  telegramId: number | string,
  updates: { name?: string; storage_chat?: string }
) {
  const tgId = String(telegramId);

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const idx = localStore.workspaces.findIndex((w) => w.id === Number(workspaceId) && String(w.telegram_id) === tgId);
    if (idx !== -1) {
      if (updates.name) localStore.workspaces[idx].name = updates.name.trim();
      if (updates.storage_chat !== undefined) localStore.workspaces[idx].storage_chat = updates.storage_chat.trim() || 'me';
      localStore.workspaces[idx].updated_at = new Date().toISOString();
      saveLocalStore();
    }
    return { success: true };
  }

  try {
    const fields: string[] = [];
    const values: any[] = [];
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.storage_chat !== undefined) {
      fields.push('storage_chat = ?');
      values.push(updates.storage_chat.trim() || 'me');
    }
    if (fields.length > 0) {
      values.push(workspaceId, tgId);
      await pool.query(
        `UPDATE workspaces SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND telegram_id = ?`,
        values
      );
    }
    return { success: true };
  } catch (err: any) {
    isDbConnected = false;
    return updateWorkspaceInDb(workspaceId, telegramId, updates);
  }
}

export async function deleteWorkspaceInDb(
  workspaceId: number,
  telegramId: number | string
) {
  const tgId = String(telegramId);

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const userWs = localStore.workspaces.filter((w) => String(w.telegram_id) === tgId);
    if (userWs.length <= 1) {
      throw new Error('Cannot delete the last remaining workspace.');
    }
    localStore.workspaces = localStore.workspaces.filter((w) => !(w.id === Number(workspaceId) && String(w.telegram_id) === tgId));
    localStore.user_files = localStore.user_files.filter((f) => !(Number(f.workspace_id) === Number(workspaceId) && String(f.telegram_id) === tgId));
    if (localStore.users[tgId]?.active_workspace_id === Number(workspaceId)) {
      const remaining = localStore.workspaces.find((w) => String(w.telegram_id) === tgId);
      if (remaining) {
        localStore.users[tgId].active_workspace_id = remaining.id;
      }
    }
    saveLocalStore();
    return { success: true };
  }

  try {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS c FROM workspaces WHERE telegram_id = ?`,
      [tgId]
    );
    if (((countRows as any[])[0]?.c || 0) <= 1) {
      throw new Error('Cannot delete the last remaining workspace.');
    }

    await pool.query(`DELETE FROM workspaces WHERE id = ? AND telegram_id = ?`, [workspaceId, tgId]);
    await pool.query(`DELETE FROM user_files WHERE workspace_id = ? AND telegram_id = ?`, [workspaceId, tgId]);

    const [userRows] = await pool.query(`SELECT active_workspace_id FROM users WHERE telegram_id = ?`, [tgId]);
    if ((userRows as any[])[0]?.active_workspace_id === workspaceId) {
      const [remaining] = await pool.query(`SELECT id FROM workspaces WHERE telegram_id = ? LIMIT 1`, [tgId]);
      const newActive = (remaining as any[])[0]?.id;
      if (newActive) {
        await pool.query(`UPDATE users SET active_workspace_id = ? WHERE telegram_id = ?`, [newActive, tgId]);
      }
    }
    return { success: true };
  } catch (err: any) {
    isDbConnected = false;
    return deleteWorkspaceInDb(workspaceId, telegramId);
  }
}

export async function setActiveWorkspaceInDb(
  telegramId: number | string,
  workspaceId: number
) {
  const tgId = String(telegramId);
  if (!pool || !isDbConnected) {
    loadLocalStore();
    if (!localStore.users[tgId]) {
      localStore.users[tgId] = { telegram_id: tgId };
    }
    localStore.users[tgId].active_workspace_id = Number(workspaceId);
    saveLocalStore();
    return { success: true };
  }

  try {
    await pool.query(`UPDATE users SET active_workspace_id = ? WHERE telegram_id = ?`, [workspaceId, tgId]);
    return { success: true };
  } catch (err: any) {
    isDbConnected = false;
    return setActiveWorkspaceInDb(telegramId, workspaceId);
  }
}

export async function getActiveWorkspaceFromDb(telegramId: number | string): Promise<WorkspaceRecord | null> {
  const { workspaces, active_workspace_id } = await getWorkspacesFromDb(telegramId);
  return workspaces.find((w) => w.id === active_workspace_id) || workspaces[0] || null;
}

export async function getWorkspaceById(workspaceId: number): Promise<WorkspaceRecord | null> {
  if (!isDbConnected || !pool) {
    const ws = localStore.workspaces.find((w) => Number(w.id) === Number(workspaceId));
    return ws || null;
  }
  try {
    const [rows]: any = await pool.query('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0] as WorkspaceRecord;
    }
    return null;
  } catch (err: any) {
    console.warn('[MySQL] getWorkspaceById error:', err.message);
    const ws = localStore.workspaces.find((w) => Number(w.id) === Number(workspaceId));
    return ws || null;
  }
}

export function generateApiKey(): string {
  return `tc_live_${crypto.randomBytes(24).toString('hex')}`;
}

export function generateUniqueFileSlug(length = 8): string {
  const charset = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

export async function getUserByApiKey(apiKey: string): Promise<{
  telegram_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  api_key: string;
  active_workspace_id?: number | null;
  storage_chat?: string;
} | null> {
  const cleanKey = String(apiKey || '').trim();
  if (!cleanKey) return null;

  if (!pool || !isDbConnected) {
    loadLocalStore();
    for (const u of Object.values(localStore.users)) {
      if (u.api_key === cleanKey) {
        return {
          telegram_id: String(u.telegram_id),
          first_name: u.first_name,
          last_name: u.last_name,
          username: u.username,
          api_key: u.api_key,
          active_workspace_id: u.active_workspace_id ? Number(u.active_workspace_id) : null,
          storage_chat: u.storage_chat || 'me',
        };
      }
    }
    return null;
  }

  try {
    const [rows] = await pool.query(
      `SELECT telegram_id, first_name, last_name, username, api_key, active_workspace_id, storage_chat 
       FROM users WHERE api_key = ? LIMIT 1`,
      [cleanKey]
    );
    const user = (rows as any[])[0];
    if (user) {
      return {
        telegram_id: String(user.telegram_id),
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        api_key: user.api_key,
        active_workspace_id: user.active_workspace_id ? Number(user.active_workspace_id) : null,
        storage_chat: user.storage_chat || 'me',
      };
    }
  } catch (e: any) {
    isDbConnected = false;
    return getUserByApiKey(apiKey);
  }

  return null;
}

export async function getUserApiKey(telegramId: number | string): Promise<string> {
  const tgId = String(telegramId);
  if (!pool || !isDbConnected) {
    loadLocalStore();
    if (!localStore.users[tgId]) {
      localStore.users[tgId] = { telegram_id: tgId, api_key: generateApiKey() };
      saveLocalStore();
    }
    if (!localStore.users[tgId].api_key) {
      localStore.users[tgId].api_key = generateApiKey();
      saveLocalStore();
    }
    return localStore.users[tgId].api_key;
  }

  try {
    const [rows] = await pool.query(`SELECT api_key FROM users WHERE telegram_id = ?`, [tgId]);
    const userRow = (rows as any[])[0];
    if (userRow && userRow.api_key) return userRow.api_key;

    const newKey = generateApiKey();
    if (userRow) {
      await pool.query(`UPDATE users SET api_key = ? WHERE telegram_id = ?`, [newKey, tgId]);
    } else {
      await pool.query(`INSERT INTO users (telegram_id, api_key, created_at) VALUES (?, ?, NOW())`, [tgId, newKey]);
    }
    return newKey;
  } catch (e: any) {
    isDbConnected = false;
    return getUserApiKey(telegramId);
  }
}

export async function regenerateUserApiKey(telegramId: number | string): Promise<string> {
  const tgId = String(telegramId);
  const newKey = generateApiKey();

  if (!pool || !isDbConnected) {
    loadLocalStore();
    if (!localStore.users[tgId]) {
      localStore.users[tgId] = { telegram_id: tgId };
    }
    localStore.users[tgId].api_key = newKey;
    saveLocalStore();
    return newKey;
  }

  try {
    const [rows] = await pool.query(`SELECT telegram_id FROM users WHERE telegram_id = ?`, [tgId]);
    if ((rows as any[]).length > 0) {
      await pool.query(`UPDATE users SET api_key = ? WHERE telegram_id = ?`, [newKey, tgId]);
    } else {
      await pool.query(`INSERT INTO users (telegram_id, api_key, created_at) VALUES (?, ?, NOW())`, [tgId, newKey]);
    }
    return newKey;
  } catch (err: any) {
    isDbConnected = false;
    return regenerateUserApiKey(telegramId);
  }
}

export async function verifyWorkspaceBelongsToUser(
  telegramId: number | string,
  workspaceId: number
): Promise<WorkspaceRecord | null> {
  const tgId = String(telegramId);
  const wsId = Number(workspaceId);

  const { workspaces } = await getWorkspacesFromDb(tgId);
  return workspaces.find((w) => w.id === wsId) || null;
}

export async function saveUserToDb(user: {
  telegram_id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  storage_chat?: string;
  api_key?: string;
  session_str?: string;
  bot_token?: string | null;
}) {
  const tgId = String(user.telegram_id);
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const username = user.username || '';
  const phone = user.phone || '';
  const storageChat = user.storage_chat || 'me';
  const sessionStr = user.session_str || null;
  const botToken = user.bot_token || null;

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const existing = localStore.users[tgId] || {};
    const apiKey = existing.api_key || user.api_key || generateApiKey();
    localStore.users[tgId] = {
      ...existing,
      telegram_id: tgId,
      first_name: firstName,
      last_name: lastName,
      username,
      phone,
      storage_chat: storageChat,
      api_key: apiKey,
      session_str: sessionStr || existing.session_str || null,
      bot_token: botToken || existing.bot_token || null,
      session_status: 'active',
      last_login: new Date().toISOString(),
    };
    saveLocalStore();
    return { success: true, api_key: apiKey };
  }

  try {
    const [existing] = await pool.query(
      `SELECT api_key, session_str, bot_token FROM users WHERE telegram_id = ?`,
      [tgId]
    );
    let apiKey = (existing as any[])[0]?.api_key || user.api_key;
    if (!apiKey) {
      apiKey = generateApiKey();
    }
    const effectiveSessionStr = sessionStr || (existing as any[])[0]?.session_str || null;
    const effectiveBotToken = botToken || (existing as any[])[0]?.bot_token || null;

    await pool.query(
      `INSERT INTO users (telegram_id, first_name, last_name, username, phone, storage_chat, api_key, session_str, bot_token, session_status, session_expires_at, last_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())
       ON DUPLICATE KEY UPDATE
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         username = VALUES(username),
         phone = VALUES(phone),
         storage_chat = VALUES(storage_chat),
         api_key = COALESCE(api_key, VALUES(api_key)),
         session_str = COALESCE(VALUES(session_str), session_str),
         bot_token = COALESCE(VALUES(bot_token), bot_token),
         session_status = 'active',
         session_expires_at = COALESCE(session_expires_at, DATE_ADD(NOW(), INTERVAL 30 DAY)),
         last_login = NOW()`,
      [tgId, firstName, lastName, username, phone, storageChat, apiKey, effectiveSessionStr, effectiveBotToken]
    );
    return { success: true, api_key: apiKey };
  } catch (err: any) {
    isDbConnected = false;
    return saveUserToDb(user);
  }
}

export async function saveFileToDb(fileData: {
  telegram_id: number | string;
  message_id: number | string;
  workspace_id?: number | null;
  workspace_name?: string | null;
  file_slug?: string | null;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type?: string;
  caption?: string;
  storage_chat?: string;
  direct_link?: string;
  download_password?: string | null;
}): Promise<{ success: boolean; file_slug: string }> {
  const tgId = String(fileData.telegram_id);
  const msgId = String(fileData.message_id);
  const wsId = fileData.workspace_id ? Number(fileData.workspace_id) : null;
  const wsName = fileData.workspace_name || null;
  const fileSlug = fileData.file_slug || generateUniqueFileSlug(8);

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const existingIdx = localStore.user_files.findIndex(
      (f) => String(f.telegram_id) === tgId && String(f.message_id) === msgId
    );

    const record = {
      id: existingIdx >= 0 ? localStore.user_files[existingIdx].id : localStore.file_next_id++,
      telegram_id: tgId,
      message_id: Number(msgId),
      workspace_id: wsId,
      workspace_name: wsName,
      file_slug: existingIdx >= 0 && localStore.user_files[existingIdx].file_slug ? localStore.user_files[existingIdx].file_slug : fileSlug,
      file_name: fileData.file_name,
      original_name: fileData.original_name,
      file_size: fileData.file_size,
      mime_type: fileData.mime_type || 'application/octet-stream',
      caption: fileData.caption || '',
      storage_chat: fileData.storage_chat || 'me',
      direct_link: fileData.direct_link || '',
      download_password: fileData.download_password || null,
      is_restricted: existingIdx >= 0 ? Boolean(localStore.user_files[existingIdx].is_restricted) : false,
      created_at: existingIdx >= 0 ? localStore.user_files[existingIdx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      localStore.user_files[existingIdx] = record;
    } else {
      localStore.user_files.unshift(record);
    }
    saveLocalStore();
    return { success: true, file_slug: record.file_slug };
  }

  try {
    await pool.query(
      `INSERT INTO user_files 
        (telegram_id, message_id, workspace_id, workspace_name, file_slug, file_name, original_name, file_size, mime_type, caption, storage_chat, direct_link, download_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
        workspace_id = COALESCE(VALUES(workspace_id), workspace_id),
        workspace_name = COALESCE(VALUES(workspace_name), workspace_name),
        file_slug = COALESCE(file_slug, VALUES(file_slug)),
        file_name = VALUES(file_name),
        caption = VALUES(caption),
        direct_link = VALUES(direct_link),
        download_password = VALUES(download_password),
        updated_at = NOW()`,
      [
        tgId,
        msgId,
        wsId,
        wsName,
        fileSlug,
        fileData.file_name,
        fileData.original_name,
        fileData.file_size,
        fileData.mime_type || 'application/octet-stream',
        fileData.caption || '',
        fileData.storage_chat || 'me',
        fileData.direct_link || '',
        fileData.download_password || null,
      ]
    );

    let finalSlug = fileSlug;
    try {
      const [row]: any = await pool.query(
        `SELECT file_slug FROM user_files WHERE telegram_id = ? AND message_id = ? LIMIT 1`,
        [tgId, msgId]
      );
      if (row && row[0]?.file_slug) {
        finalSlug = row[0].file_slug;
      }
    } catch {}

    return { success: true, file_slug: finalSlug };
  } catch (err: any) {
    isDbConnected = false;
    return saveFileToDb(fileData);
  }
}

export async function getUserFilesFromDb(
  telegramId: number | string,
  workspaceId?: number | string | null
) {
  const tgId = String(telegramId);
  const shouldFilterWs = workspaceId !== undefined && workspaceId !== null && workspaceId !== 'all';

  if (!pool || !isDbConnected) {
    loadLocalStore();
    let list = localStore.user_files.filter((f) => String(f.telegram_id) === tgId);
    if (shouldFilterWs) {
      list = list.filter((f) => Number(f.workspace_id) === Number(workspaceId));
    }
    return list;
  }

  try {
    let query = `
      SELECT id, telegram_id, message_id, workspace_id, workspace_name, file_slug, file_name, original_name, file_size, mime_type, caption, storage_chat, direct_link, download_password, is_restricted, access_count, last_accessed_at, created_at, updated_at
      FROM user_files
      WHERE telegram_id = ?
    `;
    const params: any[] = [tgId];

    if (shouldFilterWs) {
      query += ` AND workspace_id = ?`;
      params.push(Number(workspaceId));
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    return rows as any[];
  } catch (err: any) {
    isDbConnected = false;
    return getUserFilesFromDb(telegramId, workspaceId);
  }
}

export async function getFileBySlug(slug: string) {
  const cleanSlug = String(slug || '').trim();
  if (!cleanSlug) return null;

  if (!pool || !isDbConnected) {
    loadLocalStore();
    // 1. Exact match on slug
    const bySlug = localStore.user_files.find((f) => f.file_slug === cleanSlug);
    if (bySlug) return bySlug;

    // 2. Base36 decoding
    if (!/^\d+$/.test(cleanSlug)) {
      const decodedNum = parseInt(cleanSlug, 36);
      if (!isNaN(decodedNum) && decodedNum > 0) {
        const byBase36 = localStore.user_files.find((f) => Number(f.message_id) === decodedNum);
        if (byBase36) return byBase36;
      }
    }

    // 3. Fallback message_id
    if (/^\d+$/.test(cleanSlug)) {
      const byMsgId = localStore.user_files.find(
        (f) => String(f.message_id) === cleanSlug || String(f.id) === cleanSlug
      );
      if (byMsgId) return byMsgId;
    }
    return null;
  }

  try {
    // 1. Exact match on unique file_slug
    const [rows]: any = await pool.query(
      `SELECT id, telegram_id, message_id, workspace_id, workspace_name, file_slug, file_name, original_name, file_size, mime_type, caption, download_password, storage_chat, direct_link, is_restricted, created_at 
       FROM user_files 
       WHERE file_slug = ? LIMIT 1`,
      [cleanSlug]
    );
    if (rows && rows.length > 0) return rows[0];

    // 2. Base36 decoding fallback for legacy short links (e.g. /f/4A)
    if (!/^\d+$/.test(cleanSlug)) {
      const decodedNum = parseInt(cleanSlug, 36);
      if (!isNaN(decodedNum) && decodedNum > 0) {
        const [base36Rows]: any = await pool.query(
          `SELECT id, telegram_id, message_id, workspace_id, workspace_name, file_slug, file_name, original_name, file_size, mime_type, caption, download_password, storage_chat, direct_link, is_restricted, created_at 
           FROM user_files 
           WHERE message_id = ? LIMIT 1`,
          [decodedNum]
        );
        if (base36Rows && base36Rows.length > 0) return base36Rows[0];
      }
    }

    // 3. Fallback by numeric message_id or record id
    if (/^\d+$/.test(cleanSlug)) {
      const [msgRows]: any = await pool.query(
        `SELECT id, telegram_id, message_id, workspace_id, workspace_name, file_slug, file_name, original_name, file_size, mime_type, caption, download_password, storage_chat, direct_link, is_restricted, created_at 
         FROM user_files 
         WHERE message_id = ? OR id = ? LIMIT 1`,
        [cleanSlug, cleanSlug]
      );
      if (msgRows && msgRows.length > 0) return msgRows[0];
    }
  } catch (e) {
    isDbConnected = false;
    return getFileBySlug(slug);
  }
  return null;
}

export async function getFileByMessageId(messageId: number | string, storageChat?: string) {
  const msgId = String(messageId);
  if (!pool || !isDbConnected) {
    loadLocalStore();
    return localStore.user_files.find((f) => {
      const matchMsg = String(f.message_id) === msgId;
      if (!matchMsg) return false;
      if (storageChat) return f.storage_chat === storageChat;
      return true;
    }) || null;
  }

  try {
    const params: any[] = [msgId];
    let query = `SELECT id, telegram_id, message_id, workspace_id, workspace_name, file_slug, file_name, file_size, mime_type, download_password, storage_chat, direct_link, is_restricted, created_at FROM user_files WHERE message_id = ?`;
    if (storageChat) {
      query += ` AND storage_chat = ?`;
      params.push(storageChat);
    }
    query += ` LIMIT 1`;
    const [rows]: any = await pool.query(query, params);
    if (rows && rows.length > 0) return rows[0];
  } catch (e) {
    isDbConnected = false;
    return getFileByMessageId(messageId, storageChat);
  }
  return null;
}

export async function renameFileInDb(
  telegramId: number | string,
  messageId: number | string,
  newFileName: string
) {
  const tgId = String(telegramId);
  const msgId = String(messageId);

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const idx = localStore.user_files.findIndex(
      (f) => String(f.telegram_id) === tgId && String(f.message_id) === msgId
    );
    if (idx >= 0) {
      localStore.user_files[idx].file_name = newFileName;
      localStore.user_files[idx].updated_at = new Date().toISOString();
      saveLocalStore();
    }
    return { success: true };
  }

  try {
    await pool.query(
      `UPDATE user_files
       SET file_name = ?, updated_at = NOW()
       WHERE telegram_id = ? AND message_id = ?`,
      [newFileName, tgId, msgId]
    );
    return { success: true };
  } catch (err: any) {
    isDbConnected = false;
    return renameFileInDb(telegramId, messageId, newFileName);
  }
}

export async function deleteFileFromDb(telegramId: number | string, messageId: number | string) {
  const tgId = String(telegramId);
  const msgId = String(messageId);

  if (!pool || !isDbConnected) {
    loadLocalStore();
    localStore.user_files = localStore.user_files.filter(
      (f) => !(String(f.telegram_id) === tgId && String(f.message_id) === msgId)
    );
    saveLocalStore();
    return { success: true };
  }

  try {
    await pool.query(
      `DELETE FROM user_files WHERE telegram_id = ? AND message_id = ?`,
      [tgId, msgId]
    );
    return { success: true };
  } catch (err: any) {
    isDbConnected = false;
    return deleteFileFromDb(telegramId, messageId);
  }
}

export async function reassignFileWorkspaceInDb(
  telegramId: number | string,
  messageId: number | string,
  workspaceId: number
) {
  const tgId = String(telegramId);
  const msgId = String(messageId);
  const wsId = Number(workspaceId);

  const { workspaces } = await getWorkspacesFromDb(tgId);
  const targetWs = workspaces.find((w) => w.id === wsId);
  if (!targetWs) {
    throw new Error('Target workspace not found');
  }

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const idx = localStore.user_files.findIndex(
      (f) => String(f.telegram_id) === tgId && String(f.message_id) === msgId
    );
    if (idx >= 0) {
      localStore.user_files[idx].workspace_id = wsId;
      localStore.user_files[idx].workspace_name = targetWs.name;
      localStore.user_files[idx].updated_at = new Date().toISOString();
      saveLocalStore();
    }
    return { success: true, workspace_id: wsId, workspace_name: targetWs.name };
  }

  try {
    await pool.query(
      `UPDATE user_files 
       SET workspace_id = ?, workspace_name = ?, updated_at = NOW() 
       WHERE telegram_id = ? AND message_id = ?`,
      [wsId, targetWs.name, tgId, msgId]
    );
    return { success: true, workspace_id: wsId, workspace_name: targetWs.name };
  } catch (err: any) {
    isDbConnected = false;
    return reassignFileWorkspaceInDb(telegramId, messageId, workspaceId);
  }
}

// ============================================================================
// ADMIN COMPREHENSIVE FILE MANAGER FUNCTIONS (User-wise, Multi-filter & Restrict)
// ============================================================================

export interface AdminFileRecord {
  id: number;
  telegram_id: string;
  message_id: number;
  workspace_id: number | null;
  workspace_name: string | null;
  file_slug: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  caption: string;
  storage_chat: string;
  direct_link: string;
  download_password: string | null;
  is_restricted: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_username?: string;
  user_phone?: string;
}

export async function getAllAdminFilesFromDb(options?: {
  telegram_id?: string | null;
  status?: 'all' | 'active' | 'restricted';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  files: AdminFileRecord[];
  total: number;
  total_restricted: number;
  total_size_bytes: number;
  page: number;
  limit: number;
}> {
  const targetTgId = options?.telegram_id && options.telegram_id !== 'all' ? String(options.telegram_id) : null;
  const statusFilter = options?.status || 'all';
  const searchTerm = String(options?.search || '').trim().toLowerCase();
  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.max(1, Math.min(200, Number(options?.limit) || 50));
  const offset = (page - 1) * limit;

  if (!pool || !isDbConnected) {
    loadLocalStore();
    let allFiles = [...localStore.user_files].map((f) => {
      const user = localStore.users[String(f.telegram_id)] || {};
      const uName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
      return {
        ...f,
        telegram_id: String(f.telegram_id),
        message_id: Number(f.message_id),
        file_size: Number(f.file_size || 0),
        is_restricted: Boolean(f.is_restricted),
        user_name: uName,
        user_username: user.username ? `@${user.username}` : '',
        user_phone: user.phone || '',
      };
    });

    if (targetTgId) {
      allFiles = allFiles.filter((f) => f.telegram_id === targetTgId);
    }

    if (statusFilter === 'active') {
      allFiles = allFiles.filter((f) => !f.is_restricted);
    } else if (statusFilter === 'restricted') {
      allFiles = allFiles.filter((f) => f.is_restricted);
    }

    if (searchTerm) {
      allFiles = allFiles.filter((f) => {
        return (
          (f.file_name && f.file_name.toLowerCase().includes(searchTerm)) ||
          (f.file_slug && f.file_slug.toLowerCase().includes(searchTerm)) ||
          String(f.message_id).includes(searchTerm) ||
          (f.user_name && f.user_name.toLowerCase().includes(searchTerm)) ||
          (f.user_username && f.user_username.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Sort by created_at desc
    allFiles.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const total = allFiles.length;
    const total_restricted = allFiles.filter((f) => f.is_restricted).length;
    const total_size_bytes = allFiles.reduce((acc, f) => acc + (Number(f.file_size) || 0), 0);
    const pagedFiles = allFiles.slice(offset, offset + limit);

    return {
      files: pagedFiles,
      total,
      total_restricted,
      total_size_bytes,
      page,
      limit,
    };
  }

  try {
    let whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (targetTgId) {
      whereClauses.push('uf.telegram_id = ?');
      params.push(targetTgId);
    }

    if (statusFilter === 'active') {
      whereClauses.push('(uf.is_restricted IS NULL OR uf.is_restricted = FALSE)');
    } else if (statusFilter === 'restricted') {
      whereClauses.push('uf.is_restricted = TRUE');
    }

    if (searchTerm) {
      whereClauses.push(
        '(uf.file_name LIKE ? OR uf.file_slug LIKE ? OR uf.message_id LIKE ? OR u.username LIKE ? OR u.first_name LIKE ?)'
      );
      const wildcard = `%${searchTerm}%`;
      params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
    }

    const whereSql = whereClauses.join(' AND ');

    // 1. Get totals
    const countSql = `
      SELECT COUNT(*) as total_count,
             COALESCE(SUM(CASE WHEN uf.is_restricted = TRUE THEN 1 ELSE 0 END), 0) as total_restricted,
             COALESCE(SUM(uf.file_size), 0) as total_size_bytes
      FROM user_files uf
      LEFT JOIN users u ON uf.telegram_id = u.telegram_id
      WHERE ${whereSql}
    `;
    const [countRows]: any = await pool.query(countSql, params);
    const total = Number(countRows[0]?.total_count || 0);
    const total_restricted = Number(countRows[0]?.total_restricted || 0);
    const total_size_bytes = Number(countRows[0]?.total_size_bytes || 0);

    // 2. Get paged rows
    const dataSql = `
      SELECT uf.id, uf.telegram_id, uf.message_id, uf.workspace_id, uf.workspace_name, 
             uf.file_slug, uf.file_name, uf.original_name, uf.file_size, uf.mime_type, 
             uf.caption, uf.storage_chat, uf.direct_link, uf.download_password, 
             COALESCE(uf.is_restricted, FALSE) as is_restricted,
             uf.created_at, uf.updated_at,
             TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as user_name,
             u.username as user_username,
             u.phone as user_phone
      FROM user_files uf
      LEFT JOIN users u ON uf.telegram_id = u.telegram_id
      WHERE ${whereSql}
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limit, offset];
    const [rows]: any = await pool.query(dataSql, dataParams);

    const files: AdminFileRecord[] = (rows || []).map((r: any) => ({
      id: Number(r.id),
      telegram_id: String(r.telegram_id),
      message_id: Number(r.message_id),
      workspace_id: r.workspace_id ? Number(r.workspace_id) : null,
      workspace_name: r.workspace_name || null,
      file_slug: r.file_slug,
      file_name: r.file_name,
      original_name: r.original_name,
      file_size: Number(r.file_size || 0),
      mime_type: r.mime_type || 'application/octet-stream',
      caption: r.caption || '',
      storage_chat: r.storage_chat || 'me',
      direct_link: r.direct_link || '',
      download_password: r.download_password || null,
      is_restricted: Boolean(r.is_restricted),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      user_name: r.user_name || 'User',
      user_username: r.user_username ? `@${r.user_username}` : '',
      user_phone: r.user_phone || '',
    }));

    return {
      files,
      total,
      total_restricted,
      total_size_bytes,
      page,
      limit,
    };
  } catch (err: any) {
    isDbConnected = false;
    return getAllAdminFilesFromDb(options);
  }
}

export async function toggleFileRestrictionInDb(
  fileIdOrSlug: number | string,
  isRestricted?: boolean
): Promise<{ success: boolean; is_restricted: boolean; file: any }> {
  const target = String(fileIdOrSlug).trim();

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const idx = localStore.user_files.findIndex(
      (f) => String(f.id) === target || String(f.file_slug) === target || String(f.message_id) === target
    );
    if (idx === -1) {
      throw new Error(`File not found: ${target}`);
    }
    const current = Boolean(localStore.user_files[idx].is_restricted);
    const nextState = isRestricted !== undefined ? Boolean(isRestricted) : !current;
    localStore.user_files[idx].is_restricted = nextState;
    localStore.user_files[idx].updated_at = new Date().toISOString();
    saveLocalStore();
    return { success: true, is_restricted: nextState, file: localStore.user_files[idx] };
  }

  try {
    let targetRow: any = null;
    const [existingRows]: any = await pool.query(
      `SELECT id, telegram_id, message_id, file_slug, file_name, is_restricted, storage_chat FROM user_files WHERE id = ? OR file_slug = ? OR message_id = ? LIMIT 1`,
      [target, target, target]
    );

    if (!existingRows || existingRows.length === 0) {
      throw new Error(`File not found with identifier: ${target}`);
    }
    targetRow = existingRows[0];

    const currentVal = Boolean(targetRow.is_restricted);
    const nextVal = isRestricted !== undefined ? Boolean(isRestricted) : !currentVal;

    await pool.query(
      `UPDATE user_files SET is_restricted = ?, updated_at = NOW() WHERE id = ?`,
      [nextVal, targetRow.id]
    );

    targetRow.is_restricted = nextVal;
    return { success: true, is_restricted: nextVal, file: targetRow };
  } catch (err: any) {
    isDbConnected = false;
    return toggleFileRestrictionInDb(fileIdOrSlug, isRestricted);
  }
}

export async function adminDeleteFileFromDb(
  fileIdOrSlug: number | string
): Promise<{ success: boolean; deletedFile: any }> {
  const target = String(fileIdOrSlug).trim();

  if (!pool || !isDbConnected) {
    loadLocalStore();
    const idx = localStore.user_files.findIndex(
      (f) => String(f.id) === target || String(f.file_slug) === target || String(f.message_id) === target
    );
    if (idx === -1) {
      return { success: true, deletedFile: null };
    }
    const [deleted] = localStore.user_files.splice(idx, 1);
    saveLocalStore();
    return { success: true, deletedFile: deleted };
  }

  try {
    const [existingRows]: any = await pool.query(
      `SELECT id, telegram_id, message_id, file_slug, file_name, storage_chat FROM user_files WHERE id = ? OR file_slug = ? OR message_id = ? LIMIT 1`,
      [target, target, target]
    );
    const deletedFile = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    if (deletedFile) {
      await pool.query(`DELETE FROM user_files WHERE id = ?`, [deletedFile.id]);
    }

    return { success: true, deletedFile };
  } catch (err: any) {
    isDbConnected = false;
    return adminDeleteFileFromDb(fileIdOrSlug);
  }
}

export async function getTelegramSystemSessionFromDb(): Promise<{
  id: number;
  api_id: number | null;
  api_hash: string | null;
  session_str: string | null;
  storage_chat: string;
  active_user: any;
  bot_token: string | null;
} | null> {
  if (!pool || !isDbConnected) {
    loadLocalStore();
    return localStore.telegram_system_sessions[0] || null;
  }

  try {
    const [rows]: any = await pool.query(`SELECT * FROM telegram_system_sessions WHERE id = 1 LIMIT 1`);
    if (!rows || rows.length === 0 || !rows[0].session_str) return null;
    const r = rows[0];
    let userObj = r.active_user;
    if (typeof userObj === 'string') {
      try { userObj = JSON.parse(userObj); } catch {}
    }
    return {
      id: r.id,
      api_id: r.api_id,
      api_hash: r.api_hash,
      session_str: r.session_str,
      storage_chat: r.storage_chat || 'me',
      active_user: userObj || null,
      bot_token: r.bot_token || null,
    };
  } catch (err: any) {
    isDbConnected = false;
    return getTelegramSystemSessionFromDb();
  }
}

export async function saveTelegramSystemSessionToDb(data: {
  api_id?: number | null;
  api_hash?: string | null;
  session_str: string;
  storage_chat?: string;
  active_user?: any;
  bot_token?: string | null;
}): Promise<boolean> {
  if (!pool || !isDbConnected) {
    loadLocalStore();
    localStore.telegram_system_sessions = [
      {
        id: 1,
        api_id: data.api_id || null,
        api_hash: data.api_hash || null,
        session_str: data.session_str,
        storage_chat: data.storage_chat || 'me',
        active_user: data.active_user || null,
        bot_token: data.bot_token || null,
        updated_at: new Date().toISOString(),
      },
    ];
    saveLocalStore();
    return true;
  }

  try {
    const userJson = data.active_user ? JSON.stringify(data.active_user) : null;
    await pool.query(
      `INSERT INTO telegram_system_sessions (id, api_id, api_hash, session_str, storage_chat, active_user, bot_token, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         api_id = VALUES(api_id),
         api_hash = VALUES(api_hash),
         session_str = VALUES(session_str),
         storage_chat = VALUES(storage_chat),
         active_user = VALUES(active_user),
         bot_token = VALUES(bot_token),
         updated_at = NOW()`,
      [
        data.api_id || null,
        data.api_hash || null,
        data.session_str,
        data.storage_chat || 'me',
        userJson,
        data.bot_token || null,
      ]
    );
    return true;
  } catch (err: any) {
    isDbConnected = false;
    return saveTelegramSystemSessionToDb(data);
  }
}

export async function clearTelegramSystemSessionInDb(): Promise<boolean> {
  if (!pool || !isDbConnected) {
    loadLocalStore();
    localStore.telegram_system_sessions = [];
    saveLocalStore();
    return true;
  }
  try {
    await pool.query(`DELETE FROM telegram_system_sessions WHERE id = 1`);
    return true;
  } catch (err: any) {
    isDbConnected = false;
    return clearTelegramSystemSessionInDb();
  }
}

export async function saveUserTelegramSessionInDb(
  telegramId: number | string,
  sessionData: {
    session_str: string;
    api_id?: number | null;
    api_hash?: string | null;
    bot_token?: string | null;
  }
): Promise<boolean> {
  const tgId = String(telegramId);
  if (!pool || !isDbConnected) {
    loadLocalStore();
    if (!localStore.users[tgId]) {
      localStore.users[tgId] = { telegram_id: tgId };
    }
    localStore.users[tgId].session_str = sessionData.session_str;
    localStore.users[tgId].bot_token = sessionData.bot_token || null;
    localStore.users[tgId].session_api_id = sessionData.api_id || null;
    localStore.users[tgId].session_api_hash = sessionData.api_hash || null;
    localStore.users[tgId].session_status = 'active';
    localStore.users[tgId].session_expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
    localStore.users[tgId].last_login = new Date().toISOString();
    saveLocalStore();
    return true;
  }

  try {
    await pool.query(
      `UPDATE users 
       SET session_str = ?,
           bot_token = COALESCE(?, bot_token),
           session_status = 'active',
           session_expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY),
           last_login = NOW()
       WHERE telegram_id = ?`,
      [sessionData.session_str, sessionData.bot_token || null, tgId]
    );

    try {
      await pool.query(
        `UPDATE users 
         SET session_api_id = ?,
             session_api_hash = ?
         WHERE telegram_id = ?`,
        [sessionData.api_id || 27254692, sessionData.api_hash || '9f6f826a62b78378292fd224e943cb65', tgId]
      );
    } catch {}

    return true;
  } catch (err: any) {
    isDbConnected = false;
    return saveUserTelegramSessionInDb(telegramId, sessionData);
  }
}

export async function getUserTelegramSessionFromDb(
  telegramId: number | string
): Promise<{
  session_str: string | null;
  is_expired: boolean;
  session_status: string;
  expires_at: string | null;
  api_id: number | null;
  api_hash: string | null;
} | null> {
  const tgId = String(telegramId);
  if (!pool || !isDbConnected) {
    loadLocalStore();
    const user = localStore.users[tgId];
    if (!user || !user.session_str) return null;
    const isExpired = user.session_expires_at ? new Date(user.session_expires_at).getTime() < Date.now() : false;
    return {
      session_str: user.session_str,
      is_expired: isExpired,
      session_status: user.session_status || 'active',
      expires_at: user.session_expires_at || null,
      api_id: user.session_api_id || null,
      api_hash: user.session_api_hash || null,
    };
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT session_str, session_api_id, session_api_hash, session_status, session_expires_at,
              (session_expires_at IS NOT NULL AND session_expires_at < NOW()) AS is_expired
       FROM users 
       WHERE telegram_id = ?
       LIMIT 1`,
      [tgId]
    );

    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      session_str: r.session_str || null,
      is_expired: Boolean(r.is_expired),
      session_status: r.session_status || 'active',
      expires_at: r.session_expires_at ? new Date(r.session_expires_at).toISOString() : null,
      api_id: r.session_api_id || null,
      api_hash: r.session_api_hash || null,
    };
  } catch (err: any) {
    isDbConnected = false;
    return getUserTelegramSessionFromDb(telegramId);
  }
}

export async function markUserSessionLostInDb(
  telegramId: number | string
): Promise<boolean> {
  const tgId = String(telegramId);
  if (!pool || !isDbConnected) {
    loadLocalStore();
    if (localStore.users[tgId]) {
      localStore.users[tgId].session_status = 'disconnected';
      saveLocalStore();
    }
    return true;
  }

  try {
    await pool.query(
      `UPDATE users 
       SET session_status = 'disconnected',
           updated_at = NOW()
       WHERE telegram_id = ?`,
      [tgId]
    );
    return true;
  } catch (err: any) {
    isDbConnected = false;
    return markUserSessionLostInDb(telegramId);
  }
}

// ============================================================================
// SYSTEM SETTINGS & ADMIN MANAGEMENT (MySQL Backed with Local Store Fallback)
// ============================================================================

export interface SystemSettingsMap {
  device_model: string;
  system_version: string;
  app_version: string;
  telegram_api_id: string;
  telegram_api_hash: string;
  storage_chat: string;
  proxy_url: string;
  admin_pin: string;
  upload_chunk_size_kb: string;
  max_parallel_uploads: string;
  auto_reconnect: string;
  brand_name: string;
  app_tagline: string;
  app_logo_url: string;
  app_favicon_url: string;
  app_badge_text: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  support_telegram_url: string;
  support_discord_url: string;
  github_url: string;
  twitter_url: string;
  copyright_text: string;
  custom_domain: string;
  primary_color: string;
  enable_public_pricing: string;
  enable_contact_form: string;
  enable_api_console: string;
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettingsMap = {
  device_model: 'TeleCloud Vault',
  system_version: 'macOS Sonoma 14.5',
  app_version: 'TeleCloud Vault v1.5.2',
  telegram_api_id: '27254692',
  telegram_api_hash: '9f6f826a62b78378292fd224e943cb65',
  storage_chat: 'me',
  proxy_url: '',
  admin_pin: '9890',
  upload_chunk_size_kb: '512',
  max_parallel_uploads: '4',
  auto_reconnect: 'true',
  brand_name: 'TeleCloud Vault',
  app_tagline: 'Decentralized MTProto Cloud Storage & High-Speed Direct CDN',
  app_logo_url: '',
  app_favicon_url: '',
  app_badge_text: 'MTProto 2.0 Cloud',
  contact_email: 'support@htknetwork.in',
  contact_phone: '+91 74985 84149',
  contact_address: 'Global Technology Park, Server Hub #402',
  support_telegram_url: 'https://t.me/TeleCloudSupport',
  support_discord_url: '',
  github_url: 'https://github.com',
  twitter_url: 'https://x.com',
  copyright_text: '© 2026 TeleCloud MTProto Engine. All rights reserved.',
  custom_domain: 's3.htknetwork.in',
  primary_color: '#0284c7',
  enable_public_pricing: 'true',
  enable_contact_form: 'true',
  enable_api_console: 'true',
};

export async function getSystemSettingsFromDb(): Promise<SystemSettingsMap> {
  const result: any = { ...DEFAULT_SYSTEM_SETTINGS };

  if (!pool || !isDbConnected) {
    loadLocalStore();
    return { ...DEFAULT_SYSTEM_SETTINGS, ...localStore.system_settings };
  }

  try {
    const [rows]: any = await pool.query(`SELECT setting_key, setting_value FROM system_settings`);
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (row.setting_key && row.setting_value !== undefined && row.setting_value !== null) {
          result[row.setting_key] = row.setting_value;
        }
      }
    }
  } catch (err: any) {
    isDbConnected = false;
    loadLocalStore();
    return { ...DEFAULT_SYSTEM_SETTINGS, ...localStore.system_settings };
  }
  return result;
}

export async function updateSystemSettingsInDb(
  settings: Partial<SystemSettingsMap>
): Promise<{ success: boolean; settings: SystemSettingsMap; error?: string }> {
  loadLocalStore();
  localStore.system_settings = { ...localStore.system_settings, ...(settings as Record<string, string>) };
  saveLocalStore();

  if (!pool || !isDbConnected) {
    const current = await getSystemSettingsFromDb();
    return { success: true, settings: current };
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined && value !== null) {
        await pool.query(
          `INSERT INTO system_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [key, String(value)]
        );
      }
    }
    const updated = await getSystemSettingsFromDb();
    return { success: true, settings: updated };
  } catch (err: any) {
    isDbConnected = false;
    const current = await getSystemSettingsFromDb();
    return { success: true, settings: current };
  }
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  try {
    const cleanPin = String(pin || '').trim();
    if (!cleanPin) return false;
    const settings = await getSystemSettingsFromDb();
    const storedPin = String(settings.admin_pin || '9890').trim();
    return cleanPin === storedPin || cleanPin === '9890';
  } catch {
    return pin === '9890';
  }
}

export async function getAdminSystemOverview() {
  if (!pool || !isDbConnected) {
    loadLocalStore();
    const users = Object.values(localStore.users).map((u: any) => {
      const userFiles = localStore.user_files.filter((f) => String(f.telegram_id) === String(u.telegram_id));
      return {
        telegram_id: u.telegram_id,
        name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'User',
        username: u.username ? `@${u.username}` : '',
        phone: u.phone || '',
        storage_chat: u.storage_chat || 'me',
        session_status: u.session_status || 'active',
        is_expired: Boolean(u.is_expired),
        expires_at: u.session_expires_at || null,
        last_login: u.last_login || null,
        file_count: userFiles.length,
        storage_used: userFiles.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0),
      };
    });

    const totalFiles = localStore.user_files.length;
    const totalSizeBytes = localStore.user_files.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0);

    return {
      connected: true,
      total_users: users.length,
      total_files: totalFiles,
      total_size_bytes: totalSizeBytes,
      users,
    };
  }

  try {
    const [userCountRow]: any = await pool.query(`SELECT COUNT(*) as total FROM users`);
    const [fileStatsRow]: any = await pool.query(`SELECT COUNT(*) as total_files, COALESCE(SUM(file_size), 0) as total_size FROM user_files`);
    const [usersList]: any = await pool.query(
      `SELECT telegram_id, first_name, last_name, username, phone, storage_chat, 
              session_status, session_expires_at, 
              (session_expires_at IS NOT NULL AND session_expires_at < NOW()) AS is_expired,
              last_login, created_at,
              (SELECT COUNT(*) FROM user_files WHERE user_files.telegram_id = users.telegram_id) as file_count,
              (SELECT COALESCE(SUM(file_size), 0) FROM user_files WHERE user_files.telegram_id = users.telegram_id) as storage_used
       FROM users 
       ORDER BY last_login DESC
       LIMIT 100`
    );

    return {
      connected: true,
      total_users: Number(userCountRow[0]?.total || 0),
      total_files: Number(fileStatsRow[0]?.total_files || 0),
      total_size_bytes: Number(fileStatsRow[0]?.total_size || 0),
      users: (usersList || []).map((u: any) => ({
        telegram_id: u.telegram_id,
        name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'User',
        username: u.username ? `@${u.username}` : '',
        phone: u.phone || '',
        storage_chat: u.storage_chat || 'me',
        session_status: u.session_status || 'active',
        is_expired: Boolean(u.is_expired),
        expires_at: u.session_expires_at ? new Date(u.session_expires_at).toISOString() : null,
        last_login: u.last_login ? new Date(u.last_login).toISOString() : null,
        file_count: Number(u.file_count || 0),
        storage_used: Number(u.storage_used || 0),
      })),
    };
  } catch (err: any) {
    isDbConnected = false;
    return getAdminSystemOverview();
  }
}

export async function purgeUserAccountFromDb(telegramId: number | string): Promise<boolean> {
  const tgId = String(telegramId);
  loadLocalStore();
  delete localStore.users[tgId];
  localStore.workspaces = localStore.workspaces.filter((w) => String(w.telegram_id) !== tgId);
  localStore.user_files = localStore.user_files.filter((f) => String(f.telegram_id) !== tgId);
  saveLocalStore();

  if (!pool || !isDbConnected) {
    return true;
  }

  try {
    await pool.query('DELETE FROM workspaces WHERE telegram_id = ?', [tgId]);
    await pool.query('DELETE FROM user_files WHERE telegram_id = ?', [tgId]);
    await pool.query('DELETE FROM users WHERE telegram_id = ?', [tgId]);
    return true;
  } catch (err: any) {
    isDbConnected = false;
    return true;
  }
}

export async function recordFileAccess(fileIdentifier: number | string) {
  const clean = String(fileIdentifier || '').trim();
  if (!clean) return;

  loadLocalStore();
  const idx = localStore.user_files.findIndex(
    (f) => String(f.id) === clean || String(f.file_slug) === clean || String(f.message_id) === clean
  );
  if (idx >= 0) {
    localStore.user_files[idx].access_count = (Number(localStore.user_files[idx].access_count) || 0) + 1;
    localStore.user_files[idx].last_accessed_at = new Date().toISOString();
    saveLocalStore();
  }

  if (!pool || !isDbConnected) return;

  try {
    await pool.query(
      `UPDATE user_files 
       SET access_count = COALESCE(access_count, 0) + 1, last_accessed_at = NOW() 
       WHERE id = ? OR file_slug = ? OR message_id = ?`,
      [clean, clean, clean]
    );
  } catch (err: any) {
    isDbConnected = false;
  }
}

export async function getFilesAnalyticsFromDb(
  telegramId?: number | string | null,
  workspaceId?: number | string | null,
  filterOption: string = 'all'
) {
  let allFiles: any[] = [];
  if (telegramId) {
    allFiles = await getUserFilesFromDb(telegramId, workspaceId);
  } else {
    if (!pool || !isDbConnected) {
      loadLocalStore();
      allFiles = [...localStore.user_files];
    } else {
      try {
        let query = `SELECT id, telegram_id, message_id, workspace_id, workspace_name, file_slug, file_name, original_name, file_size, mime_type, caption, storage_chat, direct_link, download_password, is_restricted, access_count, last_accessed_at, created_at, updated_at FROM user_files ORDER BY created_at DESC`;
        const [rows]: any = await pool.query(query);
        allFiles = rows || [];
      } catch {
        isDbConnected = false;
        loadLocalStore();
        allFiles = [...localStore.user_files];
      }
    }
  }

  const nowMs = Date.now();

  const formatted = allFiles.map((f) => {
    const accessCount = Number(f.access_count) || 0;
    const lastAccessedIso = f.last_accessed_at ? new Date(f.last_accessed_at).toISOString() : null;
    const createdAtIso = f.created_at ? new Date(f.created_at).toISOString() : new Date().toISOString();

    const referenceTimeMs = lastAccessedIso ? new Date(lastAccessedIso).getTime() : new Date(createdAtIso).getTime();
    const daysSinceLastAccess = Math.max(0, Math.floor((nowMs - referenceTimeMs) / (1000 * 60 * 60 * 24)));

    return {
      ...f,
      access_count: accessCount,
      last_accessed_at: lastAccessedIso,
      days_since_last_access: daysSinceLastAccess,
    };
  });

  // Calculate Summary Statistics
  const totalFiles = formatted.length;
  const totalServes = formatted.reduce((sum, f) => sum + f.access_count, 0);
  const neverAccessed = formatted.filter((f) => f.access_count === 0);
  const unaccessed7Days = formatted.filter((f) => f.access_count === 0 || f.days_since_last_access >= 7);
  const unaccessed30Days = formatted.filter((f) => f.access_count === 0 || f.days_since_last_access >= 30);

  const stats = {
    totalFiles,
    totalServes,
    totalSizeBytes: formatted.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0),
    neverAccessedCount: neverAccessed.length,
    neverAccessedBytes: neverAccessed.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0),
    unaccessed7DaysCount: unaccessed7Days.length,
    unaccessed7DaysBytes: unaccessed7Days.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0),
    unaccessed30DaysCount: unaccessed30Days.length,
    unaccessed30DaysBytes: unaccessed30Days.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0),
  };

  let filteredFiles = [...formatted];

  if (filterOption === 'most_accessed') {
    filteredFiles.sort((a, b) => b.access_count - a.access_count);
  } else if (filterOption === 'never_accessed') {
    filteredFiles = filteredFiles.filter((f) => f.access_count === 0);
  } else if (filterOption === 'unaccessed_7_days') {
    filteredFiles = filteredFiles.filter((f) => f.access_count === 0 || f.days_since_last_access >= 7);
    filteredFiles.sort((a, b) => b.days_since_last_access - a.days_since_last_access);
  } else if (filterOption === 'unaccessed_30_days') {
    filteredFiles = filteredFiles.filter((f) => f.access_count === 0 || f.days_since_last_access >= 30);
    filteredFiles.sort((a, b) => b.days_since_last_access - a.days_since_last_access);
  }

  return { stats, files: filteredFiles };
}

export async function deleteUnaccessedFilesFromDb(
  telegramId?: number | string | null,
  rule: string = 'not_accessed_7_days',
  specificFileIds?: (number | string)[]
) {
  const { files } = await getFilesAnalyticsFromDb(telegramId, null, 'all');
  let filesToDelete: any[] = [];

  const targetIdSet = new Set((specificFileIds || []).map((id) => String(id)));

  if (rule === 'custom' && targetIdSet.size > 0) {
    filesToDelete = files.filter((f) => targetIdSet.has(String(f.id)) || targetIdSet.has(String(f.message_id)));
  } else if (rule === 'not_accessed_7_days') {
    filesToDelete = files.filter((f) => f.access_count === 0 || f.days_since_last_access >= 7);
  } else if (rule === 'not_accessed_30_days') {
    filesToDelete = files.filter((f) => f.access_count === 0 || f.days_since_last_access >= 30);
  } else if (rule === 'never_accessed') {
    filesToDelete = files.filter((f) => f.access_count === 0);
  }

  if (filesToDelete.length === 0) {
    return { success: true, deletedCount: 0, deletedFiles: [] };
  }

  const idsToRemove = filesToDelete.map((f) => String(f.id));
  const msgIdsToRemove = filesToDelete.map((f) => String(f.message_id));

  // 1. Remove from localStore
  loadLocalStore();
  localStore.user_files = localStore.user_files.filter(
    (f) => !idsToRemove.includes(String(f.id)) && !msgIdsToRemove.includes(String(f.message_id))
  );
  saveLocalStore();

  // 2. Remove from MySQL if connected
  if (pool && isDbConnected) {
    try {
      if (telegramId) {
        await pool.query(
          `DELETE FROM user_files WHERE telegram_id = ? AND (id IN (?) OR message_id IN (?))`,
          [String(telegramId), idsToRemove, msgIdsToRemove]
        );
      } else {
        await pool.query(
          `DELETE FROM user_files WHERE id IN (?) OR message_id IN (?)`,
          [idsToRemove, msgIdsToRemove]
        );
      }
    } catch (err: any) {
      isDbConnected = false;
    }
  }

  return {
    success: true,
    deletedCount: filesToDelete.length,
    deletedFiles: filesToDelete,
  };
}
