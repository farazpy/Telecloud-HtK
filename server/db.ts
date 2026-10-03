import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import crypto from 'crypto';

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
      connectTimeout: 8000,
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
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        mime_type VARCHAR(150) DEFAULT 'application/octet-stream',
        caption TEXT,
        storage_chat VARCHAR(255) DEFAULT 'me',
        direct_link TEXT,
        download_password VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tg_user (telegram_id),
        INDEX idx_ws_file (workspace_id),
        UNIQUE KEY uq_user_msg (telegram_id, message_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist safely
    try { await pool.query(`ALTER TABLE users ADD COLUMN active_workspace_id INT DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN api_key VARCHAR(128) UNIQUE DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN workspace_id INT DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN workspace_name VARCHAR(255) DEFAULT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE user_files ADD COLUMN download_password VARCHAR(255) DEFAULT NULL;`); } catch {}

    isDbConnected = true;
    dbInitError = null;
    console.log(`[MySQL] Connection established successfully with database: ${DB_NAME}`);
  } catch (err: any) {
    isDbConnected = false;
    dbInitError = err.message;
    console.error(`[MySQL Error] Failed to connect to MySQL at ${DB_HOST}:${DB_PORT}/${DB_NAME}: ${err.message}`);
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

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

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

  // If user has no workspace yet in MySQL, ensure initial Default Workspace exists
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

    // Always fetch the authoritative workspaces list for this user from DB
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

  // Retrieve active workspace for user
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
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

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
}

export async function updateWorkspaceInDb(
  workspaceId: number,
  telegramId: number | string,
  updates: { name?: string; storage_chat?: string }
) {
  const tgId = String(telegramId);

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

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
}

export async function deleteWorkspaceInDb(
  workspaceId: number,
  telegramId: number | string
) {
  const tgId = String(telegramId);

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

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
}

export async function setActiveWorkspaceInDb(
  telegramId: number | string,
  workspaceId: number
) {
  const tgId = String(telegramId);
  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }
  await pool.query(
    `UPDATE users SET active_workspace_id = ? WHERE telegram_id = ?`,
    [workspaceId, tgId]
  );
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

  if (!pool || !isDbConnected) {
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
    console.error('[MySQL] getUserByApiKey error:', e);
  }

  return null;
}

export async function getUserApiKey(telegramId: number | string): Promise<string> {
  const tgId = String(telegramId);
  if (!pool || !isDbConnected) {
    return generateApiKey();
  }

  try {
    const [rows] = await pool.query(
      `SELECT api_key FROM users WHERE telegram_id = ?`,
      [tgId]
    );
    const userRow = (rows as any[])[0];
    if (userRow && userRow.api_key) return userRow.api_key;

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
    return generateApiKey();
  }
}

export async function regenerateUserApiKey(telegramId: number | string): Promise<string> {
  const tgId = String(telegramId);
  const newKey = generateApiKey();

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

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

  if (!pool || !isDbConnected) {
    console.warn('[MySQL Warning] saveUserToDb called while MySQL is disconnected.');
    return { success: false, error: dbInitError };
  }

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
  return { success: true, api_key: apiKey };
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

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

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
  return { success: true };
}

export async function getUserFilesFromDb(
  telegramId: number | string,
  workspaceId?: number | string | null
) {
  const tgId = String(telegramId);
  const shouldFilterWs = workspaceId !== undefined && workspaceId !== null && workspaceId !== 'all';

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

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
}

export async function getFileByMessageId(messageId: number | string) {
  if (!pool || !isDbConnected) {
    return null;
  }
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
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

  await pool.query(
    `UPDATE user_files
     SET file_name = ?, updated_at = NOW()
     WHERE telegram_id = ? AND message_id = ?`,
    [newFileName, tgId, msgId]
  );
  return { success: true };
}

export async function deleteFileFromDb(telegramId: number | string, messageId: number | string) {
  const tgId = String(telegramId);
  const msgId = String(messageId);

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

  await pool.query(
    `DELETE FROM user_files WHERE telegram_id = ? AND message_id = ?`,
    [tgId, msgId]
  );
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

  if (!pool || !isDbConnected) {
    throw new Error(`MySQL database is not connected (${dbInitError || 'Check credentials'}).`);
  }

  await pool.query(
    `UPDATE user_files 
     SET workspace_id = ?, workspace_name = ?, updated_at = NOW() 
     WHERE telegram_id = ? AND message_id = ?`,
    [wsId, targetWs.name, tgId, msgId]
  );
  return { success: true, workspace_id: wsId, workspace_name: targetWs.name };
}
