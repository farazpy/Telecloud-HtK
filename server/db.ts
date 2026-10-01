import dotenv from 'dotenv';
dotenv.config();

import mysql, { Pool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// AI Studio & Standard MySQL Environment Variables with strict precedence
const DB_HOST = process.env.DB_HOST || process.env.DBHOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || process.env.DBPORT || 3306);
const DB_USER = process.env.DB_USER || process.env.DBUSER || process.env.DB_USERNAME || process.env.USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.DBPASSWORD || process.env.PASSWORD || '';
const DB_NAME = process.env.DB_NAME || process.env.DBNAME || 'telecloud';

let pool: Pool | null = null;
let isDbConnected = false;
let dbInitError: string | null = null;

// Local fallback file storage in case MySQL is unreachable or credentials are yet to be configured
const FALLBACK_DIR = path.resolve(process.cwd(), 'data');
const FALLBACK_FILE = path.resolve(FALLBACK_DIR, 'mysql_fallback_cache.json');

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

interface FallbackSchema {
  users: Record<string, any>;
  files: any[];
  workspaces: WorkspaceRecord[];
  active_workspaces: Record<string, number>;
}

function getFallbackData(): FallbackSchema {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      return {
        users: data.users || {},
        files: data.files || [],
        workspaces: data.workspaces || [],
        active_workspaces: data.active_workspaces || {},
      };
    }
  } catch (e) {
    console.error('[DB Fallback] Error reading cache:', e);
  }
  return { users: {}, files: [], workspaces: [], active_workspaces: {} };
}

function saveFallbackData(data: FallbackSchema) {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[DB Fallback] Error saving cache:', e);
  }
}

export async function initDb() {
  console.log(`[MySQL] Initializing connection to ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}...`);
  try {
    // Attempt connecting to MySQL server (without database first to ensure DB exists)
    const initialConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      connectTimeout: 5000,
    });

    await initialConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await initialConn.end();

    // Create Pool
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Create Users Table
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

    // Create Workspaces Table (Multiple Workspaces per Telegram Account)
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

    // Create User Files Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        message_id BIGINT NOT NULL,
        workspace_id INT DEFAULT NULL,
        workspace_name VARCHAR(255) DEFAULT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        mime_type VARCHAR(150) DEFAULT 'application/octet-stream',
        caption TEXT,
        storage_chat VARCHAR(255) DEFAULT 'me',
        direct_link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tg_user (telegram_id),
        INDEX idx_ws_file (workspace_id),
        UNIQUE KEY uq_user_msg (telegram_id, message_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Alter tables safely if columns don't exist yet
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN active_workspace_id INT DEFAULT NULL;`);
    } catch {}
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN api_key VARCHAR(128) UNIQUE DEFAULT NULL;`);
    } catch {}
    try {
      await pool.query(`ALTER TABLE user_files ADD COLUMN workspace_id INT DEFAULT NULL;`);
    } catch {}
    try {
      await pool.query(`ALTER TABLE user_files ADD COLUMN workspace_name VARCHAR(255) DEFAULT NULL;`);
    } catch {}
    try {
      await pool.query(`ALTER TABLE user_files ADD COLUMN download_password VARCHAR(255) DEFAULT NULL;`);
    } catch {}

    // Migration: By default have only Default Workspace, remove previous demo seeds
    try {
      await pool.query(`
        UPDATE workspaces 
        SET name = 'Default Workspace', slug = 'default-workspace'
        WHERE name = 'HtK Workspace' OR slug = 'htk-workspace'
      `);
      await pool.query(`
        DELETE FROM workspaces 
        WHERE (name = 'Webversea Workspace' OR slug = 'webversea-workspace')
        AND id NOT IN (SELECT DISTINCT workspace_id FROM user_files WHERE workspace_id IS NOT NULL)
      `);
    } catch (migErr) {
      console.warn('[MySQL] Workspace migration notice:', migErr);
    }

    isDbConnected = true;
    dbInitError = null;
    console.log('[MySQL] Database tables and workspace schema successfully verified & online!');
  } catch (err: any) {
    isDbConnected = false;
    dbInitError = err.message;
    console.warn(`[MySQL Notice] Could not connect to MySQL at ${DB_HOST}:${DB_PORT}: ${err.message}. Using persistent fallback engine.`);
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
  };
}

export async function getWorkspacesFromDb(telegramId: number | string): Promise<{
  workspaces: WorkspaceRecord[];
  active_workspace_id: number;
}> {
  const tgId = String(telegramId);

  if (pool && isDbConnected) {
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

      // Ensure any legacy demo names are cleanly renamed or purged so ONLY Default Workspace exists by default
      const hasLegacyDemo = workspaces.some((w) => w.name === 'HtK Workspace' || w.name === 'Webversea Workspace');
      if (hasLegacyDemo) {
        try {
          await pool.query(
            `UPDATE workspaces SET name = 'Default Workspace', slug = 'default-workspace'
             WHERE telegram_id = ? AND (name = 'HtK Workspace' OR slug = 'htk-workspace')`,
            [tgId]
          );
          await pool.query(
            `DELETE FROM workspaces 
             WHERE telegram_id = ? AND (name = 'Webversea Workspace' OR slug = 'webversea-workspace')
             AND id NOT IN (SELECT DISTINCT workspace_id FROM user_files WHERE workspace_id IS NOT NULL)`,
            [tgId]
          );
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
        } catch (migE) {
          console.warn('[MySQL] Migration in getWorkspaces notice:', migE);
        }
      }

      // If no workspaces exist yet, seed ONLY ONE Default Workspace
      if (workspaces.length === 0) {
        const [res] = await pool.query(
          `INSERT INTO workspaces (telegram_id, name, slug, storage_chat, is_default)
           VALUES (?, 'Default Workspace', 'default-workspace', 'me', TRUE)`,
          [tgId]
        );
        const insertId = (res as any).insertId;

        const [newRows] = await pool.query(
          `SELECT id, telegram_id, name, slug, storage_chat, is_default, created_at, updated_at, 0 AS file_count, 0 AS total_bytes
           FROM workspaces WHERE id = ?`,
          [insertId]
        );
        workspaces = (newRows as any[]).map((r) => ({ ...r, is_default: Boolean(r.is_default) }));
      }

      // Check user's active workspace
      const [userRows] = await pool.query(
        `SELECT active_workspace_id FROM users WHERE telegram_id = ?`,
        [tgId]
      );
      let activeId = (userRows as any[])[0]?.active_workspace_id;
      if (!activeId || !workspaces.some((w) => w.id === activeId)) {
        activeId = workspaces[0].id;
        await pool.query(
          `UPDATE users SET active_workspace_id = ? WHERE telegram_id = ?`,
          [activeId, tgId]
        );
      }

      return { workspaces, active_workspace_id: activeId };
    } catch (e: any) {
      console.error('[MySQL] getWorkspacesFromDb error:', e);
    }
  }

  // Persistent Fallback implementation
  const cache = getFallbackData();
  let userWs = cache.workspaces.filter((w) => String(w.telegram_id) === tgId);

  if (userWs.length === 0) {
    const defaultWs: WorkspaceRecord = {
      id: 1,
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
    cache.workspaces.push(defaultWs);
    cache.active_workspaces[tgId] = defaultWs.id;
    saveFallbackData(cache);
    userWs = [defaultWs];
  }

  // Calculate file counts in fallback
  const enriched = userWs.map((w) => {
    const wsFiles = cache.files.filter(
      (f) => String(f.telegram_id) === tgId && (f.workspace_id === w.id || (!f.workspace_id && w.is_default))
    );
    const totalBytes = wsFiles.reduce((acc, f) => acc + (Number(f.file_size) || 0), 0);
    return {
      ...w,
      file_count: wsFiles.length,
      total_bytes: totalBytes,
    };
  });

  const activeId = cache.active_workspaces[tgId] || enriched[0].id;
  return { workspaces: enriched, active_workspace_id: activeId };
}

export async function createWorkspaceInDb(
  telegramId: number | string,
  name: string,
  storageChat: string = 'me'
): Promise<WorkspaceRecord> {
  const tgId = String(telegramId);
  const cleanName = name.trim();
  const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  if (pool && isDbConnected) {
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
    } catch (e: any) {
      console.error('[MySQL] createWorkspaceInDb error:', e);
      throw e;
    }
  }

  // Fallback
  const cache = getFallbackData();
  const newWs: WorkspaceRecord = {
    id: Date.now(),
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
  cache.workspaces.push(newWs);
  saveFallbackData(cache);
  return newWs;
}

export async function updateWorkspaceInDb(
  workspaceId: number,
  telegramId: number | string,
  updates: { name?: string; storage_chat?: string }
) {
  const tgId = String(telegramId);

  if (pool && isDbConnected) {
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
    } catch (e: any) {
      console.error('[MySQL] updateWorkspaceInDb error:', e);
      throw e;
    }
  }

  // Fallback
  const cache = getFallbackData();
  const ws = cache.workspaces.find((w) => w.id === workspaceId && String(w.telegram_id) === tgId);
  if (ws) {
    if (updates.name) ws.name = updates.name.trim();
    if (updates.storage_chat !== undefined) ws.storage_chat = updates.storage_chat.trim() || 'me';
    ws.updated_at = new Date().toISOString();
    saveFallbackData(cache);
    return { success: true };
  }
  return { success: false, error: 'Workspace not found' };
}

export async function deleteWorkspaceInDb(
  workspaceId: number,
  telegramId: number | string
) {
  const tgId = String(telegramId);

  if (pool && isDbConnected) {
    try {
      // Check total workspaces
      const [countRows] = await pool.query(
        `SELECT COUNT(*) AS c FROM workspaces WHERE telegram_id = ?`,
        [tgId]
      );
      if (((countRows as any[])[0]?.c || 0) <= 1) {
        throw new Error('Cannot delete the last remaining workspace.');
      }

      await pool.query(
        `DELETE FROM workspaces WHERE id = ? AND telegram_id = ?`,
        [workspaceId, tgId]
      );

      // Reassign active workspace if deleted
      const [userRows] = await pool.query(
        `SELECT active_workspace_id FROM users WHERE telegram_id = ?`,
        [tgId]
      );
      if ((userRows as any[])[0]?.active_workspace_id === workspaceId) {
        const [remaining] = await pool.query(
          `SELECT id FROM workspaces WHERE telegram_id = ? LIMIT 1`,
          [tgId]
        );
        const newActive = (remaining as any[])[0]?.id;
        if (newActive) {
          await pool.query(
            `UPDATE users SET active_workspace_id = ? WHERE telegram_id = ?`,
            [newActive, tgId]
          );
        }
      }

      return { success: true };
    } catch (e: any) {
      console.error('[MySQL] deleteWorkspaceInDb error:', e);
      throw e;
    }
  }

  // Fallback
  const cache = getFallbackData();
  const userWs = cache.workspaces.filter((w) => String(w.telegram_id) === tgId);
  if (userWs.length <= 1) {
    throw new Error('Cannot delete the last remaining workspace.');
  }

  cache.workspaces = cache.workspaces.filter(
    (w) => !(w.id === workspaceId && String(w.telegram_id) === tgId)
  );
  if (cache.active_workspaces[tgId] === workspaceId) {
    const firstRemaining = cache.workspaces.find((w) => String(w.telegram_id) === tgId);
    if (firstRemaining) {
      cache.active_workspaces[tgId] = firstRemaining.id;
    }
  }
  saveFallbackData(cache);
  return { success: true };
}

export async function setActiveWorkspaceInDb(
  telegramId: number | string,
  workspaceId: number
) {
  const tgId = String(telegramId);

  if (pool && isDbConnected) {
    try {
      await pool.query(
        `UPDATE users SET active_workspace_id = ? WHERE telegram_id = ?`,
        [workspaceId, tgId]
      );
      return { success: true };
    } catch (e: any) {
      console.error('[MySQL] setActiveWorkspaceInDb error:', e);
    }
  }

  const cache = getFallbackData();
  cache.active_workspaces[tgId] = workspaceId;
  saveFallbackData(cache);
  return { success: true };
}

export async function getActiveWorkspaceFromDb(telegramId: number | string): Promise<WorkspaceRecord | null> {
  const { workspaces, active_workspace_id } = await getWorkspacesFromDb(telegramId);
  return workspaces.find((w) => w.id === active_workspace_id) || workspaces[0] || null;
}

export function generateApiKey(): string {
  return `tc_live_${crypto.randomBytes(24).toString('hex')}`;
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

  if (pool && isDbConnected) {
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
      console.error('[MySQL] getUserByApiKey error:', e);
    }
  }

  // Fallback cache check
  const cache = getFallbackData();
  for (const [tgId, u] of Object.entries(cache.users)) {
    if (u.api_key && u.api_key === cleanKey) {
      return {
        telegram_id: String(tgId),
        first_name: u.first_name,
        last_name: u.last_name,
        username: u.username,
        api_key: u.api_key,
        active_workspace_id: cache.active_workspaces[tgId] || null,
        storage_chat: u.storage_chat || 'me',
      };
    }
  }

  return null;
}

export async function getUserApiKey(telegramId: number | string): Promise<string> {
  const tgId = String(telegramId);
  if (pool && isDbConnected) {
    try {
      const [rows] = await pool.query(
        `SELECT api_key FROM users WHERE telegram_id = ?`,
        [tgId]
      );
      const userRow = (rows as any[])[0];
      if (userRow && userRow.api_key) return userRow.api_key;

      // If not yet generated, create and save (upsert)
      const newKey = generateApiKey();
      if (userRow) {
        await pool.query(
          `UPDATE users SET api_key = ? WHERE telegram_id = ?`,
          [newKey, tgId]
        );
      } else {
        await pool.query(
          `INSERT INTO users (telegram_id, api_key, created_at) VALUES (?, ?, NOW())`,
          [tgId, newKey]
        );
      }
      return newKey;
    } catch (e: any) {
      console.error('[MySQL] getUserApiKey error:', e);
    }
  }

  // Fallback cache
  const cache = getFallbackData();
  if (cache.users[tgId]?.api_key) {
    return cache.users[tgId].api_key;
  }
  const newKey = generateApiKey();
  if (!cache.users[tgId]) {
    cache.users[tgId] = { telegram_id: tgId, created_at: new Date().toISOString() };
  }
  cache.users[tgId].api_key = newKey;
  saveFallbackData(cache);
  return newKey;
}

export async function regenerateUserApiKey(telegramId: number | string): Promise<string> {
  const tgId = String(telegramId);
  const newKey = generateApiKey();

  if (pool && isDbConnected) {
    try {
      const [rows] = await pool.query(
        `SELECT telegram_id FROM users WHERE telegram_id = ?`,
        [tgId]
      );
      if ((rows as any[]).length > 0) {
        await pool.query(
          `UPDATE users SET api_key = ? WHERE telegram_id = ?`,
          [newKey, tgId]
        );
      } else {
        await pool.query(
          `INSERT INTO users (telegram_id, api_key, created_at) VALUES (?, ?, NOW())`,
          [tgId, newKey]
        );
      }
      return newKey;
    } catch (e: any) {
      console.error('[MySQL] regenerateUserApiKey error:', e);
    }
  }

  const cache = getFallbackData();
  if (!cache.users[tgId]) {
    cache.users[tgId] = { telegram_id: tgId };
  }
  cache.users[tgId].api_key = newKey;
  saveFallbackData(cache);
  return newKey;
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
}) {
  const tgId = BigInt(user.telegram_id);
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const username = user.username || '';
  const phone = user.phone || '';
  const storageChat = user.storage_chat || 'me';

  if (pool && isDbConnected) {
    try {
      // Check existing api_key
      const [existing] = await pool.query(
        `SELECT api_key FROM users WHERE telegram_id = ?`,
        [tgId.toString()]
      );
      let apiKey = (existing as any[])[0]?.api_key || user.api_key;
      if (!apiKey) {
        apiKey = generateApiKey();
      }

      await pool.query(
        `INSERT INTO users (telegram_id, first_name, last_name, username, phone, storage_chat, api_key, last_login)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           first_name = VALUES(first_name),
           last_name = VALUES(last_name),
           username = VALUES(username),
           phone = VALUES(phone),
           storage_chat = VALUES(storage_chat),
           api_key = COALESCE(api_key, VALUES(api_key)),
           last_login = NOW()`,
        [tgId.toString(), firstName, lastName, username, phone, storageChat, apiKey]
      );
      return { success: true, mode: 'mysql', api_key: apiKey };
    } catch (e: any) {
      console.error('[MySQL] saveUserToDb error:', e);
    }
  }

  // Fallback
  const cache = getFallbackData();
  const existingKey = cache.users[tgId.toString()]?.api_key || user.api_key || generateApiKey();
  cache.users[tgId.toString()] = {
    telegram_id: tgId.toString(),
    first_name: firstName,
    last_name: lastName,
    username,
    phone,
    storage_chat: storageChat,
    api_key: existingKey,
    updated_at: new Date().toISOString(),
  };
  saveFallbackData(cache);
  return { success: true, mode: 'fallback', api_key: existingKey };
}

export async function saveFileToDb(fileData: {
  telegram_id: number | string;
  message_id: number | string;
  workspace_id?: number | null;
  workspace_name?: string | null;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type?: string;
  caption?: string;
  storage_chat?: string;
  direct_link?: string;
  download_password?: string | null;
}) {
  const tgId = String(fileData.telegram_id);
  const msgId = String(fileData.message_id);
  const wsId = fileData.workspace_id ? Number(fileData.workspace_id) : null;
  const wsName = fileData.workspace_name || null;

  if (pool && isDbConnected) {
    try {
      await pool.query(
        `INSERT INTO user_files 
          (telegram_id, message_id, workspace_id, workspace_name, file_name, original_name, file_size, mime_type, caption, storage_chat, direct_link, download_password, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
          workspace_id = COALESCE(VALUES(workspace_id), workspace_id),
          workspace_name = COALESCE(VALUES(workspace_name), workspace_name),
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
      return { success: true, mode: 'mysql' };
    } catch (e: any) {
      console.error('[MySQL] saveFileToDb error:', e);
    }
  }

  // Fallback
  const cache = getFallbackData();
  const existingIdx = cache.files.findIndex(
    (f) => String(f.telegram_id) === tgId && String(f.message_id) === msgId
  );
  const record = {
    telegram_id: tgId,
    message_id: Number(msgId),
    workspace_id: wsId,
    workspace_name: wsName,
    file_name: fileData.file_name,
    original_name: fileData.original_name,
    file_size: fileData.file_size,
    mime_type: fileData.mime_type || 'application/octet-stream',
    caption: fileData.caption || '',
    storage_chat: fileData.storage_chat || 'me',
    direct_link: fileData.direct_link || '',
    download_password: fileData.download_password || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    cache.files[existingIdx] = { ...cache.files[existingIdx], ...record };
  } else {
    cache.files.unshift(record);
  }
  saveFallbackData(cache);
  return { success: true, mode: 'fallback' };
}

export async function getUserFilesFromDb(
  telegramId: number | string,
  workspaceId?: number | string | null
) {
  const tgId = String(telegramId);
  const shouldFilterWs = workspaceId !== undefined && workspaceId !== null && workspaceId !== 'all';

  if (pool && isDbConnected) {
    try {
      let query = `
        SELECT id, telegram_id, message_id, workspace_id, workspace_name, file_name, original_name, file_size, mime_type, caption, storage_chat, direct_link, download_password, created_at, updated_at
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
    } catch (e: any) {
      console.error('[MySQL] getUserFilesFromDb error:', e);
    }
  }

  // Fallback
  const cache = getFallbackData();
  return cache.files.filter((f) => {
    if (String(f.telegram_id) !== tgId) return false;
    if (shouldFilterWs) {
      return Number(f.workspace_id) === Number(workspaceId);
    }
    return true;
  });
}

export async function getFileByMessageId(messageId: number | string) {
  if (pool && isDbConnected) {
    try {
      const [rows]: any[] = await pool.query(
        `SELECT id, telegram_id, message_id, file_name, file_size, mime_type, download_password, storage_chat, direct_link, created_at 
         FROM user_files 
         WHERE message_id = ? LIMIT 1`,
        [String(messageId)]
      );
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.error('[MySQL] getFileByMessageId error:', e);
    }
  }
  const cache = getFallbackData();
  const f = cache.files.find((file) => String(file.message_id) === String(messageId));
  return f || null;
}

export async function renameFileInDb(
  telegramId: number | string,
  messageId: number | string,
  newFileName: string
) {
  const tgId = String(telegramId);
  const msgId = String(messageId);

  if (pool && isDbConnected) {
    try {
      await pool.query(
        `UPDATE user_files
         SET file_name = ?, updated_at = NOW()
         WHERE telegram_id = ? AND message_id = ?`,
        [newFileName, tgId, msgId]
      );
      return { success: true, mode: 'mysql' };
    } catch (e: any) {
      console.error('[MySQL] renameFileInDb error:', e);
    }
  }

  // Fallback
  const cache = getFallbackData();
  const file = cache.files.find(
    (f) => String(f.telegram_id) === tgId && String(f.message_id) === msgId
  );
  if (file) {
    file.file_name = newFileName;
    file.updated_at = new Date().toISOString();
    saveFallbackData(cache);
    return { success: true, mode: 'fallback' };
  }
  return { success: false, error: 'File not found' };
}

export async function deleteFileFromDb(telegramId: number | string, messageId: number | string) {
  const tgId = String(telegramId);
  const msgId = String(messageId);

  if (pool && isDbConnected) {
    try {
      await pool.query(
        `DELETE FROM user_files WHERE telegram_id = ? AND message_id = ?`,
        [tgId, msgId]
      );
      return { success: true };
    } catch (e: any) {
      console.error('[MySQL] deleteFileFromDb error:', e);
    }
  }

  // Fallback
  const cache = getFallbackData();
  cache.files = cache.files.filter(
    (f) => !(String(f.telegram_id) === tgId && String(f.message_id) === msgId)
  );
  saveFallbackData(cache);
  return { success: true };
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

  if (pool && isDbConnected) {
    try {
      await pool.query(
        `UPDATE user_files 
         SET workspace_id = ?, workspace_name = ?, updated_at = NOW() 
         WHERE telegram_id = ? AND message_id = ?`,
        [wsId, targetWs.name, tgId, msgId]
      );
      return { success: true, workspace_id: wsId, workspace_name: targetWs.name };
    } catch (e: any) {
      console.error('[MySQL] reassignFileWorkspaceInDb error:', e);
      throw e;
    }
  }

  // Fallback
  const cache = getFallbackData();
  const file = cache.files.find(
    (f) => String(f.telegram_id) === tgId && String(f.message_id) === msgId
  );
  if (file) {
    file.workspace_id = wsId;
    file.workspace_name = targetWs.name;
    file.updated_at = new Date().toISOString();
    saveFallbackData(cache);
    return { success: true, workspace_id: wsId, workspace_name: targetWs.name };
  }
  return { success: false, error: 'File not found' };
}
