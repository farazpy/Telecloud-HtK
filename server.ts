import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import multer from 'multer';
import crypto from 'crypto';
import {
  initDb,
  saveUserToDb,
  saveFileToDb,
  getUserFilesFromDb,
  renameFileInDb,
  deleteFileFromDb,
  reassignFileWorkspaceInDb,
  getDbStatus,
  getWorkspacesFromDb,
  createWorkspaceInDb,
  updateWorkspaceInDb,
  deleteWorkspaceInDb,
  setActiveWorkspaceInDb,
  getActiveWorkspaceFromDb,
  getUserByApiKey,
  getUserApiKey,
  regenerateUserApiKey,
  verifyWorkspaceBelongsToUser,
  getFileByMessageId,
  getTelegramSystemSessionFromDb,
  saveTelegramSystemSessionToDb,
  clearTelegramSystemSessionInDb,
  saveUserTelegramSessionInDb,
  getUserTelegramSessionFromDb,
  markUserSessionLostInDb,
  getSystemSettingsFromDb,
  updateSystemSettingsInDb,
  verifyAdminPin,
  getAdminSystemOverview,
  purgeUserAccountFromDb,
} from './server/db.ts';

const app = express();
const PORT = process.env.PORT || 3000;
const PY_PORT = 5050;
const PY_BASE = `http://127.0.0.1:${PY_PORT}/api/py`;

// Initialize MySQL database and auto-restore Telegram session if available
initDb()
  .then(() => {
    setTimeout(async () => {
      await restoreSessionFromMysql().catch((e) => console.warn('[MySQL] Auto-restore notice:', e.message));
      await syncMysqlSettingsToPython().catch((e) => console.warn('[MySQL] Settings sync notice:', e.message));
    }, 2500);
  })
  .catch((err) => console.error('[MySQL] init error:', err));

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
});

const handleUploadMiddleware = (req: Request, res: Response, next: any) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File Too Large',
          message: 'The uploaded file exceeds the maximum allowed size of 50MB.',
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Upload Error',
        message: err.message || 'An error occurred during file upload.',
      });
    }
    next();
  });
};

app.use(express.json());

// Spawn Python Telethon daemon
let pyProcess: ChildProcess | null = null;

function ensurePythonDepsAndStart() {
  const pyScript = path.resolve(process.cwd(), 'server', 'telethon_service.py');
  
  // Quick check if python dependencies are present
  const check = spawn('python3', ['-c', 'import telethon, aiohttp']);
  check.on('close', (code) => {
    if (code !== 0) {
      console.log('[Node] Installing Python dependencies (telethon, aiohttp)...');
      const install = spawn('python3', ['-m', 'pip', 'install', 'telethon', 'aiohttp', '--break-system-packages'], {
        stdio: 'inherit',
      });
      install.on('close', (pipCode) => {
        if (pipCode !== 0) {
          const apt = spawn('apt-get', ['install', '-y', 'python3-aiohttp', 'python3-telethon'], {
            stdio: 'inherit',
          });
          apt.on('close', () => {
            startPythonService();
          });
        } else {
          startPythonService();
        }
      });
    } else {
      startPythonService();
    }
  });
}

function startPythonService() {
  const pyScript = path.resolve(process.cwd(), 'server', 'telethon_service.py');
  console.log(`[Node] Launching Telethon MTProto Engine: ${pyScript} on port ${PY_PORT}`);
  
  pyProcess = spawn('python3', [pyScript], {
    env: { ...process.env, PY_PORT: String(PY_PORT) },
    stdio: 'inherit',
  });

  pyProcess.on('error', (err) => {
    console.error('[Node] Failed to start Telethon Python Engine:', err);
  });

  pyProcess.on('exit', (code, signal) => {
    console.warn(`[Node] Telethon Python Engine exited with code ${code}, signal ${signal}. Restarting in 3s...`);
    setTimeout(startPythonService, 3000);
  });
}

ensurePythonDepsAndStart();

process.on('exit', () => {
  if (pyProcess) pyProcess.kill();
});

// Contact & Support Form Submission Handler
app.post('/api/contact', (req: Request, res: Response) => {
  try {
    const { name, email, category, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, email, and message are required.',
      });
    }

    const ticketId = 'TC-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    console.log(`[Contact Form] Submission received from ${name} <${email}>: [${category || 'General'}] ${subject || '(No subject)'} -> Ticket #${ticketId}`);

    return res.json({
      success: true,
      ticketId,
      message: `Inquiry successfully registered under Ticket #${ticketId}. Our engineering & support desk will respond to ${email} promptly.`,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process contact submission',
      message: err.message,
    });
  }
});

// Helper for proxying JSON requests to Python Telethon engine
async function forwardToPython(
  method: string,
  endpoint: string,
  body?: any
): Promise<{ status: number; data: any }> {
  // Retry loop in case Python service is initializing
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${PY_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      try {
        return { status: res.status, data: JSON.parse(text) };
      } catch {
        return { status: res.status, data: { message: text } };
      }
    } catch (err: any) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      return {
        status: 503,
        data: { error: `Telegram MTProto service is starting up: ${err.message}` },
      };
    }
  }
  return { status: 503, data: { error: 'Telegram MTProto service unavailable' } };
}

function getShortLink(messageId: number | string, _req?: Request): string {
  const shortId = Number(messageId).toString(36).toUpperCase();
  const domain = process.env.CUSTOM_DOMAIN || 's3.htknetwork.in';
  return `https://${domain}/f/${shortId}`;
}

// Synchronize active Telegram MTProto Session from Python to MySQL (User 30-day & Admin Fallback)
async function syncSessionToMysql(telegramId?: number | string, explicitSessionStr?: string, explicitBotToken?: string) {
  try {
    let sessionStr = explicitSessionStr;
    let apiId = 27254692;
    let apiHash = '9f6f826a62b78378292fd224e943cb65';
    let storageChat = 'me';
    let activeUser: any = null;
    let botToken: string | null = explicitBotToken || null;

    if (!sessionStr || !botToken) {
      const sessionRes = await forwardToPython('GET', '/session_data');
      if (sessionRes.status === 200) {
        if (!sessionStr) {
          sessionStr = sessionRes.data?.session_str;
        }
        apiId = sessionRes.data?.api_id || apiId;
        apiHash = sessionRes.data?.api_hash || apiHash;
        storageChat = sessionRes.data?.storage_chat || storageChat;
        activeUser = sessionRes.data?.user;
        if (!botToken) {
          botToken = sessionRes.data?.bot_token || null;
        }
      }
    }

    if (sessionStr) {
      // 1. Persist to system admin fallback session
      await saveTelegramSystemSessionToDb({
        api_id: apiId,
        api_hash: apiHash,
        session_str: sessionStr,
        storage_chat: storageChat,
        active_user: activeUser,
        bot_token: botToken,
      });

      // 2. Persist 30-day user session in MySQL
      const tgId = telegramId || activeUser?.id;
      if (tgId) {
        await saveUserTelegramSessionInDb(tgId, {
          session_str: sessionStr,
          api_id: apiId,
          api_hash: apiHash,
          bot_token: botToken,
        });
      }
      console.log(`[MySQL Session] Telegram MTProto session synced to MySQL for user #${tgId || 'admin'}.`);
    }
  } catch (err: any) {
    console.warn('[MySQL Session] Notice syncing session to MySQL:', err.message);
  }
}

// Synchronize system settings from MySQL to Python daemon
async function syncMysqlSettingsToPython() {
  try {
    const settings = await getSystemSettingsFromDb();
    if (settings) {
      await forwardToPython('POST', '/device_config', {
        device_model: settings.device_model,
        system_version: settings.system_version,
        app_version: settings.app_version,
        proxy_url: settings.proxy_url,
      });
      console.log(`[MySQL Settings] Device identity "${settings.device_model}" synced to Python daemon.`);
    }
  } catch (err: any) {
    console.warn('[MySQL Settings] Startup sync notice:', err.message);
  }
}

// Auto-restore Telegram MTProto Session from MySQL if disconnected
async function restoreSessionFromMysql(): Promise<boolean> {
  try {
    const saved = await getTelegramSystemSessionFromDb();
    if (!saved || !saved.session_str) return false;

    // Check if python is already connected
    const statusRes = await forwardToPython('GET', '/status');
    if (statusRes.status === 200 && statusRes.data?.connected) {
      return true;
    }

    console.log('[MySQL Session] Restoring Telegram MTProto session from MySQL database...');
    const connectPayload: any = {
      api_id: saved.api_id || 27254692,
      api_hash: saved.api_hash || '9f6f826a62b78378292fd224e943cb65',
      storage_chat: saved.storage_chat || 'me',
    };
    if (saved.bot_token) {
      connectPayload.bot_token = saved.bot_token;
    } else {
      connectPayload.string_session = saved.session_str;
    }

    const connectRes = await forwardToPython('POST', '/connect', connectPayload);

    if (connectRes.status === 200) {
      console.log('[MySQL Session] Telegram MTProto session successfully restored from MySQL!');
      return true;
    } else {
      console.warn('[MySQL Session] Notice restoring session from MySQL:', connectRes.data);
      return false;
    }
  } catch (err: any) {
    console.warn('[MySQL Session] Warning restoring session from MySQL:', err.message);
    return false;
  }
}

// API Routes

app.get('/api/status', async (req: Request, res: Response) => {
  let result = await forwardToPython('GET', '/status');
  if (result.status === 200 && !result.data?.connected) {
    // Attempt auto-restoration from MySQL before returning disconnected
    const restored = await restoreSessionFromMysql();
    if (restored) {
      result = await forwardToPython('GET', '/status');
    }
  }

  // Check user session status if a specific user ID is passed
  const queryTgId = req.query.telegram_id as string;
  let userSessionInfo: any = null;
  let connectivityLost = false;

  if (queryTgId) {
    const uSess = await getUserTelegramSessionFromDb(queryTgId);
    if (!uSess?.session_str && result.data?.connected && String(result.data?.user?.id) === String(queryTgId)) {
      // Auto-heal session string in MySQL if user is already connected in Python
      await syncSessionToMysql(queryTgId);
    }

    if (uSess) {
      if (uSess.is_expired || uSess.session_status === 'disconnected') {
        connectivityLost = true;
        userSessionInfo = {
          connected: false,
          connectivity_lost: true,
          reconnect_required: true,
          error: 'Telegram connectivity lost, login to dashboard and click reconnect button.',
          expires_at: uSess.expires_at,
          status: uSess.is_expired ? 'expired' : 'disconnected',
        };
      } else if (uSess.session_str) {
        // Validate with Telethon daemon
        const verifyRes = await forwardToPython('POST', '/verify_session', { session_str: uSess.session_str });
        if (verifyRes.data?.valid) {
          userSessionInfo = {
            connected: true,
            connectivity_lost: false,
            expires_at: uSess.expires_at,
            status: 'active',
          };
        } else {
          await markUserSessionLostInDb(queryTgId);
          connectivityLost = true;
          userSessionInfo = {
            connected: false,
            connectivity_lost: true,
            reconnect_required: true,
            error: 'Telegram connectivity lost, login to dashboard and click reconnect button.',
            status: 'disconnected',
          };
        }
      }
    }
  } else if (result.data?.connected && result.data?.user?.id) {
    // Sync current active session to admin/user in MySQL quietly
    syncSessionToMysql(result.data.user.id).catch(() => {});
  }

  if (result.status === 200 && result.data && result.data.user) {
    // Sync active telegram user to MySQL
    saveUserToDb({
      telegram_id: result.data.user.id,
      first_name: result.data.user.first_name,
      last_name: result.data.user.last_name,
      username: result.data.user.username,
      phone: result.data.user.phone,
      storage_chat: result.data.storage_chat,
    }).catch((e) => console.error('[MySQL] User sync error:', e));

    res.json({
      ...result.data,
      user_session: userSessionInfo,
      connectivity_lost: connectivityLost,
      error: connectivityLost ? 'Telegram connectivity lost, login to dashboard and click reconnect button.' : undefined,
    });
  } else if (result.status === 200) {
    res.json({
      ...result.data,
      user_session: userSessionInfo,
      connectivity_lost: connectivityLost,
      error: connectivityLost ? 'Telegram connectivity lost, login to dashboard and click reconnect button.' : undefined,
    });
  } else {
    // Graceful fallback status so frontend never fails with 503 or HTML errors
    res.json({
      connected: false,
      has_session: false,
      status: 'starting',
      connectivity_lost: true,
      error: 'Telegram connectivity lost, login to dashboard and click reconnect button.',
      message: result.data?.error || 'Telegram MTProto service is initializing',
    });
  }
});

app.get('/api/db/status', (_req: Request, res: Response) => {
  res.json(getDbStatus());
});

app.get('/api/device-config', async (_req: Request, res: Response) => {
  const result = await forwardToPython('GET', '/device_config');
  res.status(result.status).json(result.data);
});

app.post('/api/device-config', async (req: Request, res: Response) => {
  const result = await forwardToPython('POST', '/device_config', req.body);
  res.status(result.status).json(result.data);
});

app.post('/api/connect', async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    api_id: req.body.api_id || process.env.TELEGRAM_API_ID || 27254692,
    api_hash: req.body.api_hash || process.env.TELEGRAM_API_HASH || '9f6f826a62b78378292fd224e943cb65',
    storage_chat: req.body.storage_chat || 'me',
  };
  const result = await forwardToPython('POST', '/connect', payload);
  if (result.status === 200 && result.data?.user) {
    const sessionStr = result.data.session_str || req.body.string_session || undefined;
    await saveUserToDb({
      telegram_id: result.data.user.id,
      first_name: result.data.user.first_name,
      username: result.data.user.username,
      storage_chat: req.body.storage_chat || 'me',
      session_str: sessionStr,
      bot_token: req.body.bot_token || undefined,
    }).catch((e) => console.error('[MySQL] saveUserToDb error:', e));

    // Persist session to MySQL (User 30-Day & System Fallback)
    await syncSessionToMysql(result.data.user.id, sessionStr, req.body.bot_token);
  }
  res.status(result.status).json(result.data);
});

app.post('/api/send_code', async (req: Request, res: Response) => {
  let phone = String(req.body.phone || '').trim().replace(/[\s\-\(\)]/g, '');
  if (phone && !phone.startsWith('+')) {
    phone = `+${phone}`;
  }
  const payload = {
    ...req.body,
    phone,
    api_id: Number(req.body.api_id || process.env.TELEGRAM_API_ID || 27254692),
    api_hash: String(req.body.api_hash || process.env.TELEGRAM_API_HASH || '9f6f826a62b78378292fd224e943cb65').trim(),
    storage_chat: req.body.storage_chat || 'me',
  };
  const result = await forwardToPython('POST', '/send_code', payload);
  res.status(result.status).json(result.data);
});

app.post('/api/sign_in', async (req: Request, res: Response) => {
  let phone = String(req.body.phone || '').trim().replace(/[\s\-\(\)]/g, '');
  if (phone && !phone.startsWith('+')) {
    phone = `+${phone}`;
  }
  const payload = {
    ...req.body,
    phone,
    api_id: Number(req.body.api_id || process.env.TELEGRAM_API_ID || 27254692),
    api_hash: String(req.body.api_hash || process.env.TELEGRAM_API_HASH || '9f6f826a62b78378292fd224e943cb65').trim(),
  };
  const result = await forwardToPython('POST', '/sign_in', payload);
  if (result.status === 200 && result.data?.user) {
    const sessionStr = result.data.session_str || undefined;
    await saveUserToDb({
      telegram_id: result.data.user.id,
      first_name: result.data.user.first_name,
      last_name: result.data.user.last_name,
      username: result.data.user.username,
      phone: result.data.user.phone || phone,
      storage_chat: 'me',
      session_str: sessionStr,
    }).catch((e) => console.error('[MySQL] user save error:', e));

    // Persist 30-day session to MySQL
    await syncSessionToMysql(result.data.user.id, sessionStr);
  }
  res.status(result.status).json(result.data);
});

app.post(['/api/qr/start', '/api/telegram/qr/start'], async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    api_id: Number(req.body.api_id || process.env.TELEGRAM_API_ID || 27254692),
    api_hash: String(req.body.api_hash || process.env.TELEGRAM_API_HASH || '9f6f826a62b78378292fd224e943cb65').trim(),
    storage_chat: req.body.storage_chat || 'me',
  };
  const result = await forwardToPython('POST', '/qr/start', payload);
  res.status(result.status).json(result.data);
});

app.post(['/api/qr/check', '/api/telegram/qr/check'], async (req: Request, res: Response) => {
  const result = await forwardToPython('POST', '/qr/check', req.body);
  if (result.status === 200 && result.data?.user) {
    const sessionStr = result.data.session_str || undefined;
    await saveUserToDb({
      telegram_id: result.data.user.id,
      first_name: result.data.user.first_name,
      last_name: result.data.user.last_name,
      username: result.data.user.username,
      phone: result.data.user.phone || '',
      storage_chat: 'me',
      session_str: sessionStr,
    }).catch((e) => console.error('[MySQL] user save error:', e));

    // Persist session to MySQL on successful QR authorization (30-day user session + admin fallback)
    await syncSessionToMysql(result.data.user.id, sessionStr);
  }
  res.status(result.status).json(result.data);
});

app.post('/api/disconnect', async (req: Request, res: Response) => {
  const tgId = req.body?.telegram_id;
  if (tgId) {
    await markUserSessionLostInDb(tgId).catch(() => {});
  }
  await clearTelegramSystemSessionInDb().catch((e) => console.error('[MySQL] clear error:', e));
  const result = await forwardToPython('POST', '/disconnect');
  res.status(result.status).json(result.data);
});

app.post('/api/user/delete-account', async (req: Request, res: Response) => {
  const { telegram_id, delete_telegram_files } = req.body;
  if (!telegram_id) {
    return res.status(400).json({ error: 'telegram_id is required' });
  }

  try {
    const tgId = String(telegram_id);
    console.log(`[Delete Account] Starting account deletion for user #${tgId}...`);

    if (delete_telegram_files) {
      // 1. Fetch all user's files from DB
      const dbFiles = await getUserFilesFromDb(tgId);
      console.log(`[Delete Account] Found ${dbFiles.length} files to delete from Telegram.`);

      // 2. Loop through and delete from Telegram via MTProto python service
      for (const file of dbFiles) {
        if (file.message_id) {
          try {
            await forwardToPython('DELETE', `/files/${file.message_id}`);
          } catch (err: any) {
            console.warn(`[Delete Account] Failed to delete message #${file.message_id} from Telegram:`, err.message);
          }
        }
      }
    }

    // 3. Clear sessions and disconnect client from Python service
    try {
      await forwardToPython('POST', '/disconnect');
    } catch {}

    // 4. Delete user records from MySQL
    await purgeUserAccountFromDb(tgId);
    console.log(`[Delete Account] MySQL records successfully purged for user #${tgId}.`);

    return res.json({ success: true, message: 'Account, catalog files, and workspace integrations permanently deleted.' });
  } catch (err: any) {
    console.error('[Delete Account Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete account' });
  }
});

// ============================================================================
// ADMIN PANEL API ENDPOINTS (/admin Protected by PIN 9890 / Custom PIN)
// ============================================================================

app.post('/api/admin/verify', async (req: Request, res: Response) => {
  try {
    const { pin } = req.body || {};
    const isValid = await verifyAdminPin(pin);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid Admin PIN. Access denied.' });
    }
    return res.json({ success: true, message: 'Admin authentication verified.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/settings', async (req: Request, res: Response) => {
  try {
    const pin = (req.headers['x-admin-pin'] as string) || (req.query.pin as string);
    if (!(await verifyAdminPin(pin))) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Valid Admin PIN required.' });
    }

    const settings = await getSystemSettingsFromDb();
    const dbStatus = getDbStatus();
    const overview = await getAdminSystemOverview();
    const pyStatus = await forwardToPython('GET', '/status').catch(() => ({ data: {} }));
    const deviceConfig = await forwardToPython('GET', '/device_config').catch(() => ({ data: {} }));

    return res.json({
      success: true,
      settings,
      dbStatus,
      overview,
      telethonStatus: pyStatus.data,
      device_model: deviceConfig.data?.device_model || settings.device_model,
      system_version: deviceConfig.data?.system_version || settings.system_version,
      app_version: deviceConfig.data?.app_version || settings.app_version,
      proxy_url: deviceConfig.data?.proxy_url || settings.proxy_url,
      location: deviceConfig.data?.location || null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/settings', async (req: Request, res: Response) => {
  try {
    const pin = (req.headers['x-admin-pin'] as string) || (req.body?.pin as string);
    if (!(await verifyAdminPin(pin))) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Valid Admin PIN required.' });
    }

    const updates = { ...req.body };
    delete updates.pin; // Do not treat pin payload as setting key unless updating admin_pin explicitly

    const result = await updateSystemSettingsInDb(updates);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    // Sync device identity and proxy configuration directly to Telethon Python daemon
    const pySync = await forwardToPython('POST', '/device_config', {
      device_model: result.settings.device_model,
      system_version: result.settings.system_version,
      app_version: result.settings.app_version,
      proxy_url: result.settings.proxy_url,
    }).catch((e) => ({ data: { error: e.message } }));

    return res.json({
      success: true,
      message: 'Settings updated in MySQL database and propagated to active system workers.',
      settings: result.settings,
      location: pySync.data?.location || null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/reconnect', async (req: Request, res: Response) => {
  try {
    const pin = (req.headers['x-admin-pin'] as string) || (req.body?.pin as string);
    if (!(await verifyAdminPin(pin))) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Valid Admin PIN required.' });
    }

    const { telegram_id } = req.body;
    if (!telegram_id) {
      return res.status(400).json({ success: false, error: 'telegram_id is required' });
    }

    const uSess = await getUserTelegramSessionFromDb(telegram_id);
    if (!uSess || !uSess.session_str) {
      return res.status(400).json({
        success: false,
        error: 'No Telegram MTProto session string found in MySQL for this user. User must log in.',
      });
    }

    const verifyRes = await forwardToPython('POST', '/verify_session', { session_str: uSess.session_str });
    if (verifyRes.data?.valid) {
      await saveUserTelegramSessionInDb(telegram_id, {
        session_str: uSess.session_str,
        api_id: uSess.api_id,
        api_hash: uSess.api_hash,
      });
      return res.json({
        success: true,
        message: `Session for user #${telegram_id} verified active and renewed for 30 days.`,
      });
    } else {
      await markUserSessionLostInDb(telegram_id);
      return res.json({
        success: false,
        error: 'Session has been revoked or expired on Telegram servers. User must re-authenticate.',
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Workspace endpoints (Multi-workspace per Telegram account in MySQL)
app.get(['/api/workspaces', '/api/v1/workspaces'], async (req: Request, res: Response) => {
  try {
    let tgId = req.query.telegram_id as string;
    if (!tgId) {
      const auth = await authenticateApiRequest(req);
      if (auth.authenticated && auth.user) {
        tgId = auth.user.telegram_id;
      }
    }
    if (!tgId) {
      const statusRes = await forwardToPython('GET', '/status');
      tgId = statusRes.data?.user?.id;
    }
    if (!tgId) {
      res.json({ workspaces: [], active_workspace_id: null });
      return;
    }

    const result = await getWorkspacesFromDb(tgId);
    const activeWs = result.workspaces.find((w) => w.id === result.active_workspace_id) || result.workspaces[0] || null;
    res.json({ ...result, active_workspace: activeWs });
  } catch (err: any) {
    console.error('[Workspaces] error in /api/workspaces:', err);
    res.json({ workspaces: [], active_workspace_id: null, error: err.message });
  }
});

app.post('/api/workspaces', async (req: Request, res: Response): Promise<void> => {
  let tgId = req.body.telegram_id as string;
  if (!tgId) {
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
  }
  if (!tgId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const name = String(req.body.name || '').trim();
  const storageChat = String(req.body.storage_chat || 'me').trim();
  if (!name) {
    res.status(400).json({ error: 'Workspace name is required.' });
    return;
  }

  try {
    const newWs = await createWorkspaceInDb(tgId, name, storageChat);
    res.json({ success: true, workspace: newWs });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to create workspace' });
  }
});

app.put('/api/workspaces/:id', async (req: Request, res: Response): Promise<void> => {
  const wsId = Number(req.params.id);
  let tgId = req.body.telegram_id as string;
  if (!tgId) {
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
  }
  if (!tgId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    const result = await updateWorkspaceInDb(wsId, tgId, req.body);
    const activeWs = await getActiveWorkspaceFromDb(tgId);
    if (activeWs && activeWs.id === wsId && req.body.storage_chat) {
      await forwardToPython('POST', '/storage', { storage_chat: req.body.storage_chat });
    }
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to update workspace' });
  }
});

app.delete('/api/workspaces/:id', async (req: Request, res: Response): Promise<void> => {
  const wsId = Number(req.params.id);
  const statusRes = await forwardToPython('GET', '/status');
  let tgId = statusRes.data?.user?.id || req.body.telegram_id || req.query.telegram_id;
  if (!tgId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    await deleteWorkspaceInDb(wsId, tgId);
    const activeWs = await getActiveWorkspaceFromDb(tgId);
    if (activeWs) {
      await forwardToPython('POST', '/storage', { storage_chat: activeWs.storage_chat });
    }
    res.json({ success: true, active_workspace_id: activeWs?.id });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to delete workspace' });
  }
});

app.post('/api/workspaces/:id/switch', async (req: Request, res: Response): Promise<void> => {
  const wsId = Number(req.params.id);
  const statusRes = await forwardToPython('GET', '/status');
  const tgId = statusRes.data?.user?.id;
  if (!tgId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    await setActiveWorkspaceInDb(tgId, wsId);
    const activeWs = await getActiveWorkspaceFromDb(tgId);
    if (activeWs) {
      // Sync active workspace's storage_chat with Python daemon
      await forwardToPython('POST', '/storage', { storage_chat: activeWs.storage_chat });
    }
    res.json({ success: true, active_workspace: activeWs });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to switch workspace' });
  }
});

app.post('/api/storage', async (req: Request, res: Response) => {
  const storageChat = req.body.storage_chat || 'me';
  const result = await forwardToPython('POST', '/storage', req.body);
  
  // Also synchronize storage_chat with user's active workspace in MySQL
  const statusRes = await forwardToPython('GET', '/status');
  const tgId = statusRes.data?.user?.id;
  if (tgId) {
    const activeWs = await getActiveWorkspaceFromDb(tgId);
    if (activeWs) {
      await updateWorkspaceInDb(activeWs.id, tgId, { storage_chat: storageChat });
    }
  }

  // Persist updated storage destination to MySQL session
  syncSessionToMysql().catch(() => {});

  res.status(result.status).json(result.data);
});

app.get('/api/storage/chats', async (_req: Request, res: Response) => {
  const result = await forwardToPython('GET', '/dialogs');
  if (result.status === 200) {
    res.json(result.data);
  } else {
    res.json({
      dialogs: [
        {
          id: 'me',
          title: 'Self (Saved Messages)',
          type: 'self',
          is_self: true,
          badge: 'Private & Default',
          description: 'Your personal Telegram Saved Messages chat',
        },
      ],
      current: 'me',
    });
  }
});

// List files from MySQL linked to telegram_id (and optional workspace_id)
app.get(['/api/user/files', '/api/v1/files'], async (req: Request, res: Response) => {
  let tgId = req.query.telegram_id as string;
  let workspaceId = req.query.workspace_id as string;

  if (!tgId) {
    const auth = await authenticateApiRequest(req);
    if (auth.authenticated && auth.user) {
      tgId = auth.user.telegram_id;
      if (!workspaceId && (req.query.workspace_id || req.headers['x-workspace-id'])) {
        workspaceId = String(req.query.workspace_id || req.headers['x-workspace-id']);
      }
    }
  }

  if (!tgId) {
    // If not supplied, query python status to find current user
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
    if (!tgId) {
      res.json({ files: [], total: 0 });
      return;
    }
  }
  const dbFiles = await getUserFilesFromDb(tgId, workspaceId);
  const formattedFiles = dbFiles.map(file => {
    return {
      ...file,
      direct_link: getShortLink(file.message_id, req)
    };
  });
  res.json({ files: formattedFiles, total: formattedFiles.length });
});

// Fetch & Import historical Telegram files from channel / chat into MySQL database
app.post(['/api/files/fetch-telegram', '/api/files/sync-telegram'], async (req: Request, res: Response) => {
  try {
    let tgId = req.body?.telegram_id || (req.query.telegram_id as string);
    if (!tgId) {
      const auth = await authenticateApiRequest(req);
      if (auth.authenticated && auth.user) {
        tgId = auth.user.telegram_id;
      }
    }
    if (!tgId) {
      const statusRes = await forwardToPython('GET', '/status');
      tgId = statusRes.data?.user?.id;
    }
    if (!tgId) {
      return res.status(401).json({ success: false, error: 'Telegram authentication required to fetch channel files.' });
    }

    const workspaceId = req.body?.workspace_id ? Number(req.body.workspace_id) : null;
    let storageChat = req.body?.storage_chat;
    let workspaceName: string | null = null;

    if (workspaceId) {
      const wsList = await getWorkspacesFromDb(tgId);
      const matched = wsList.workspaces.find((w) => w.id === workspaceId);
      if (matched) {
        storageChat = matched.storage_chat || storageChat || 'me';
        workspaceName = matched.name;
      }
    }

    if (!storageChat) {
      const activeWs = await getActiveWorkspaceFromDb(tgId);
      storageChat = activeWs?.storage_chat || 'me';
      if (!workspaceId && activeWs) {
        workspaceName = activeWs.name;
      }
    }

    // Retrieve active Telegram MTProto session for user from MySQL
    const userSessionRecord = await getUserTelegramSessionFromDb(tgId);
    const sessionStr = userSessionRecord?.session_str || undefined;

    console.log(`[Fetch Telegram] Scanning chat '${storageChat}' for user #${tgId} (workspace: ${workspaceName || 'Default'})...`);

    // Call Python Telethon service to scan MTProto history
    const pyRes = await forwardToPython('POST', '/fetch_history', {
      storage_chat: storageChat,
      session_str: sessionStr,
      limit: 300,
    });

    if (!pyRes.data || !Array.isArray(pyRes.data.files)) {
      return res.status(500).json({
        success: false,
        error: pyRes.data?.error || 'Failed to retrieve media history from Telegram.',
      });
    }

    const fetchedFiles = pyRes.data.files;
    let importedCount = 0;

    for (const f of fetchedFiles) {
      if (!f.message_id) continue;
      try {
        await saveFileToDb({
          telegram_id: tgId,
          message_id: f.message_id,
          workspace_id: workspaceId,
          workspace_name: workspaceName,
          file_name: f.file_name || `file_${f.message_id}.bin`,
          original_name: f.file_name || `file_${f.message_id}.bin`,
          file_size: Number(f.file_size || 0),
          mime_type: f.mime_type || 'application/octet-stream',
          caption: f.caption || '',
          storage_chat: storageChat,
          direct_link: '',
        });
        importedCount++;
      } catch (saveErr: any) {
        console.warn(`[Fetch Telegram] Notice saving file #${f.message_id}:`, saveErr.message);
      }
    }

    // Retrieve updated files list from MySQL for the user and workspace
    const dbFiles = await getUserFilesFromDb(tgId, workspaceId || undefined);
    const formatted = dbFiles.map((file) => ({
      ...file,
      direct_link: getShortLink(file.message_id, req),
    }));

    return res.json({
      success: true,
      imported_count: importedCount,
      total_found: fetchedFiles.length,
      storage_chat: storageChat,
      workspace_id: workspaceId,
      files: formatted,
      message: `Successfully scanned and imported ${importedCount} old files from Telegram into MySQL!`,
    });
  } catch (err: any) {
    console.error('[Fetch Telegram Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Analytics and stats for dashboard (workspace-aware)
app.get('/api/user/stats', async (req: Request, res: Response) => {
  let tgId = req.query.telegram_id as string;
  const workspaceId = req.query.workspace_id as string;
  if (!tgId) {
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
  }
  if (!tgId) {
    res.json({
      totalFiles: 0,
      totalBytes: 0,
      breakdown: {
        images: { count: 0, bytes: 0 },
        videos: { count: 0, bytes: 0 },
        audio: { count: 0, bytes: 0 },
        documents: { count: 0, bytes: 0 },
        archives: { count: 0, bytes: 0 },
        others: { count: 0, bytes: 0 },
      },
      recentFiles: [],
    });
    return;
  }

  const files = await getUserFilesFromDb(tgId, workspaceId);
  const totalFiles = files.length;
  let totalBytes = 0;
  const breakdown: Record<string, { count: number; bytes: number }> = {
    images: { count: 0, bytes: 0 },
    videos: { count: 0, bytes: 0 },
    audio: { count: 0, bytes: 0 },
    documents: { count: 0, bytes: 0 },
    archives: { count: 0, bytes: 0 },
    others: { count: 0, bytes: 0 },
  };

  for (const f of files) {
    const size = Number(f.file_size) || 0;
    totalBytes += size;
    const mime = (f.mime_type || '').toLowerCase();
    const name = (f.file_name || '').toLowerCase();

    if (mime.startsWith('image/')) {
      breakdown.images.count++;
      breakdown.images.bytes += size;
    } else if (mime.startsWith('video/')) {
      breakdown.videos.count++;
      breakdown.videos.bytes += size;
    } else if (mime.startsWith('audio/')) {
      breakdown.audio.count++;
      breakdown.audio.bytes += size;
    } else if (
      mime.includes('pdf') ||
      mime.includes('text') ||
      mime.includes('document') ||
      mime.includes('sheet') ||
      mime.includes('presentation')
    ) {
      breakdown.documents.count++;
      breakdown.documents.bytes += size;
    } else if (
      mime.includes('zip') ||
      mime.includes('tar') ||
      mime.includes('rar') ||
      name.endsWith('.gz') ||
      name.endsWith('.7z')
    ) {
      breakdown.archives.count++;
      breakdown.archives.bytes += size;
    } else {
      breakdown.others.count++;
      breakdown.others.bytes += size;
    }
  }

  res.json({
    totalFiles,
    totalBytes,
    breakdown,
    recentFiles: files.slice(0, 5),
  });
});

// Rename file in MySQL
app.post('/api/files/rename', async (req: Request, res: Response): Promise<void> => {
  const { telegram_id, message_id, new_file_name } = req.body;
  if (!message_id || !new_file_name) {
    res.status(400).json({ error: 'Missing message_id or new_file_name' });
    return;
  }

  let tgId = telegram_id;
  if (!tgId) {
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
  }

  if (!tgId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const directDownloadUrl = getShortLink(message_id, req);

  const result = await renameFileInDb(tgId, message_id, new_file_name);
  if (result.success) {
    res.json({
      success: true,
      message_id,
      file_name: new_file_name,
      direct_link: directDownloadUrl,
    });
  } else {
    res.status(404).json({ error: (result as any).error || 'Failed to rename file' });
  }
});

// Reassign file to a different workspace in MySQL
app.post('/api/files/reassign', async (req: Request, res: Response): Promise<void> => {
  const { message_id, workspace_id, telegram_id } = req.body;
  if (!message_id || !workspace_id) {
    res.status(400).json({ error: 'Missing message_id or workspace_id' });
    return;
  }
  let tgId = telegram_id;
  if (!tgId) {
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
  }
  if (!tgId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }
  try {
    const result = await reassignFileWorkspaceInDb(tgId, message_id, Number(workspace_id));
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to reassign workspace' });
  }
});

app.get('/api/files', async (_req: Request, res: Response) => {
  const result = await forwardToPython('GET', '/files');
  res.status(result.status).json(result.data);
});

app.delete('/api/files/:id', async (req: Request, res: Response) => {
  const statusRes = await forwardToPython('GET', '/status');
  const tgId = statusRes.data?.user?.id;
  if (tgId) {
    await deleteFileFromDb(tgId, req.params.id);
  }
  const result = await forwardToPython('DELETE', `/files/${req.params.id}`);
  res.status(result.status).json(result.data);
});

// Bulk delete files endpoint
app.post('/api/files/bulk-delete', async (req: Request, res: Response): Promise<void> => {
  const ids: (number | string)[] = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'No file IDs provided for bulk deletion.' });
    return;
  }

  const statusRes = await forwardToPython('GET', '/status');
  const tgId = statusRes.data?.user?.id;
  const deletedIds: (number | string)[] = [];
  const errors: string[] = [];

  for (const id of ids) {
    try {
      if (tgId) {
        await deleteFileFromDb(tgId, id).catch(() => {});
      }
      const pyResult = await forwardToPython('DELETE', `/files/${id}`);
      if (pyResult.status === 200) {
        deletedIds.push(id);
      } else {
        // If file deleted from DB, consider it deleted from catalog
        deletedIds.push(id);
      }
    } catch (e: any) {
      errors.push(`Error deleting file #${id}: ${e.message}`);
    }
  }

  res.json({
    success: true,
    deleted_count: deletedIds.length,
    deleted_ids: deletedIds,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// Shared manifest generator endpoint for selected files
app.get('/api/manifest', async (req: Request, res: Response): Promise<void> => {
  const idsParam = String(req.query.ids || '').trim();
  const format = String(req.query.format || '').toLowerCase();
  const isDownload = req.query.download === 'true' || req.query.download === '1';

  if (!idsParam) {
    res.status(400).json({ error: 'Missing ids parameter. E.g. /api/manifest?ids=12,34,56' });
    return;
  }

  const idSet = new Set(idsParam.split(',').map((id) => id.trim()).filter(Boolean));
  if (idSet.size === 0) {
    res.status(400).json({ error: 'No valid file IDs provided.' });
    return;
  }

  const domain = process.env.CUSTOM_DOMAIN || 's3.htknetwork.in';
  const appUrl = process.env.APP_URL || `https://${domain}`;

  // Query files from DB or Python
  const statusRes = await forwardToPython('GET', '/status');
  const tgId = statusRes.data?.user?.id;
  let allFiles: any[] = [];

  if (tgId) {
    allFiles = await getUserFilesFromDb(tgId);
  }
  if (allFiles.length === 0) {
    const pyFilesRes = await forwardToPython('GET', '/files');
    allFiles = pyFilesRes.data?.files || [];
  }

  const selectedFiles = allFiles.filter((f) => idSet.has(String(f.message_id)));

  if (format === 'm3u') {
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename="telecloud-playlist.m3u"');
    let m3u = '#EXTM3U\n';
    for (const f of selectedFiles) {
      const link = getShortLink(f.message_id, req);
      m3u += `#EXTINF:-1,${f.file_name}\n${link}\n`;
    }
    res.send(m3u);
    return;
  }

  let totalBytes = 0;
  const manifestFiles = selectedFiles.map((f) => {
    const size = Number(f.file_size) || 0;
    totalBytes += size;
    return {
      message_id: f.message_id,
      file_name: f.file_name,
      file_size: size,
      mime_type: f.mime_type || 'application/octet-stream',
      direct_link: getShortLink(f.message_id, req),
      created_at: f.created_at || f.date,
    };
  });

  const manifestData = {
    manifest_name: 'TeleCloud Shared Files Manifest',
    manifest_url: `${appUrl}/api/manifest?ids=${idsParam}`,
    generated_at: new Date().toISOString(),
    total_files: manifestFiles.length,
    total_bytes: totalBytes,
    files: manifestFiles,
  };

  if (isDownload) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="telecloud-manifest.json"');
  }

  res.json(manifestData);
});

// API Integrity: Authenticate by API Key or active Telegram session
async function authenticateApiRequest(req: Request): Promise<{
  authenticated: boolean;
  user?: {
    telegram_id: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    api_key?: string;
    active_workspace_id?: number | null;
    storage_chat?: string;
  };
  authMethod?: 'api_key' | 'session';
  error?: string;
}> {
  // Extract API key from x-api-key header, Authorization: Bearer, query or body
  let apiKey = (req.headers['x-api-key'] as string) || '';
  const authHeader = req.headers.authorization;
  if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.slice(7).trim();
  }
  if (!apiKey && req.body?.api_key) {
    apiKey = String(req.body.api_key).trim();
  }
  if (!apiKey && req.query?.api_key) {
    apiKey = String(req.query.api_key).trim();
  }

  if (apiKey) {
    const user = await getUserByApiKey(apiKey);
    if (!user) {
      return { authenticated: false, error: 'Invalid or revoked API key' };
    }
    return { authenticated: true, user, authMethod: 'api_key' };
  }

  // Session fallback from active MTProto connection
  const statusRes = await forwardToPython('GET', '/status');
  if (statusRes.status === 200 && statusRes.data?.user?.id) {
    const tgUser = statusRes.data.user;
    const tgId = String(tgUser.id);
    const key = await getUserApiKey(tgId);
    return {
      authenticated: true,
      user: {
        telegram_id: tgId,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username,
        api_key: key,
        storage_chat: statusRes.data.storage_chat || 'me',
      },
      authMethod: 'session',
    };
  }

  return {
    authenticated: false,
    error: 'API key is required. Pass user API key via "x-api-key" header or "api_key" parameter.'
  };
}

// Compute SHA-256 for uploaded file payload integrity
function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

// Unified API Integrity File Upload Handler
async function handleSecureUpload(req: Request, res: Response): Promise<void> {
  const tempPath = req.file?.path;

  try {
    // 1. Authenticate Request with API Key or active session
    const auth = await authenticateApiRequest(req);
    if (!auth.authenticated || !auth.user) {
      if (tempPath) fs.unlink(tempPath, () => {});
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: auth.error || 'Invalid or missing API key.',
      });
      return;
    }

    // 2. Validate File presence
    if (!req.file || req.file.size === 0) {
      if (tempPath) fs.unlink(tempPath, () => {});
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No file uploaded or file is empty. Attach a file under form field "file".',
      });
      return;
    }

    // Double-safety Size Check (50MB Limit)
    if (req.file.size > 50 * 1024 * 1024) {
      if (tempPath) fs.unlink(tempPath, () => {});
      res.status(400).json({
        success: false,
        error: 'File Too Large',
        message: 'The uploaded file exceeds the maximum allowed size of 50MB.',
      });
      return;
    }

    const filePath = req.file.path;

    // 3. Payload Integrity Check (SHA-256 hash)
    const fileSha256 = await computeFileSha256(filePath);
    const expectedChecksum = String(
      req.headers['x-content-sha256'] || req.body.checksum || req.body.sha256 || ''
    ).trim();

    if (expectedChecksum && expectedChecksum.toLowerCase() !== fileSha256.toLowerCase()) {
      fs.unlink(filePath, () => {});
      res.status(400).json({
        success: false,
        error: 'Integrity Check Failed',
        message: `Checksum mismatch. Expected ${expectedChecksum}, but calculated ${fileSha256}.`,
        calculated_sha256: fileSha256,
      });
      return;
    }

    // 4. Validate Target Workspace ID
    const requestedWsId = req.body.workspace_id || req.headers['x-workspace-id'] || req.query.workspace_id;
    let targetWs: any = null;

    if (requestedWsId) {
      targetWs = await verifyWorkspaceBelongsToUser(auth.user.telegram_id, Number(requestedWsId));
      if (!targetWs) {
        fs.unlink(filePath, () => {});
        res.status(403).json({
          success: false,
          error: 'Forbidden: Invalid Workspace',
          message: `Workspace #${requestedWsId} does not exist or does not belong to user account #${auth.user.telegram_id}.`,
        });
        return;
      }
    } else {
      targetWs = await getActiveWorkspaceFromDb(auth.user.telegram_id);
    }

    // Direct MTProto upload to workspace's configured chat destination
    if (targetWs && targetWs.storage_chat) {
      await forwardToPython('POST', '/storage', { storage_chat: targetWs.storage_chat });
    }

    const originalName = req.file.originalname;
    const customFileName = req.body.file_name || originalName;
    const caption = req.body.caption || '';

    // Retrieve authenticated user's 30-day session from MySQL
    const userSession = await getUserTelegramSessionFromDb(auth.user.telegram_id);
    let sessionStrToUse: string | undefined = undefined;
    if (userSession && !userSession.is_expired && userSession.session_status === 'active') {
      sessionStrToUse = userSession.session_str || undefined;
    }

    // Guarantee active Telegram MTProto session (auto-restore from MySQL if server restarted)
    const statusCheck = await forwardToPython('GET', '/status');
    if (statusCheck.status !== 200 || !statusCheck.data?.connected) {
      await restoreSessionFromMysql().catch(() => {});
    }

    // 5. Execute MTProto Upload via Telethon Daemon (uses user session, fallback to Admin session)
    const pyResult = await forwardToPython('POST', '/upload', {
      file_path: filePath,
      file_name: customFileName,
      caption,
      session_str: sessionStrToUse,
    });

    // Remove temp file from disk
    fs.unlink(filePath, () => {});

    if (pyResult.status !== 200) {
      const errMsg = pyResult.data?.error || 'Telegram upload failed';
      const isConnLost = errMsg.toLowerCase().includes('connectivity lost') || errMsg.toLowerCase().includes('reconnect');
      res.status(isConnLost ? 401 : pyResult.status).json({
        success: false,
        error: isConnLost ? 'telegram_connectivity_lost' : errMsg,
        message: 'Telegram connectivity lost, login to dashboard and click reconnect button.',
        reconnect_required: true,
      });
      return;
    }

    const messageId = pyResult.data.message_id;
    const directDownloadUrl = getShortLink(messageId, req);
    const telegramChat = pyResult.data.chat_id || targetWs?.storage_chat || 'me';

    let telegramLink = 'https://t.me/me';
    if (telegramChat && String(telegramChat).startsWith('-100')) {
      const channelClean = String(telegramChat).replace('-100', '');
      telegramLink = `https://t.me/c/${channelClean}/${messageId}`;
    }

    // 6. Record File in MySQL Database Catalog
    const downloadPassword = req.body.password || req.body.download_password || null;
    await saveFileToDb({
      telegram_id: auth.user.telegram_id,
      message_id: messageId,
      workspace_id: targetWs?.id || null,
      workspace_name: targetWs?.name || 'Default Workspace',
      file_name: customFileName,
      original_name: originalName,
      file_size: pyResult.data.file_size || req.file.size,
      mime_type: pyResult.data.mime_type || req.file.mimetype,
      caption,
      storage_chat: telegramChat,
      direct_link: directDownloadUrl,
      download_password: downloadPassword,
    });

    // 7. Return direct file_url in JSON response
    res.json({
      success: true,
      file_url: directDownloadUrl,
      direct_link: directDownloadUrl,
      message_id: messageId,
      file_name: customFileName,
      original_name: originalName,
      file_size: pyResult.data.file_size || req.file.size,
      mime_type: pyResult.data.mime_type || req.file.mimetype,
      workspace_id: targetWs?.id,
      workspace_name: targetWs?.name,
      storage_chat: telegramChat,
      caption: caption || null,
      checksum_sha256: fileSha256,
      telegram_link: telegramLink,
      auth_method: auth.authMethod,
      has_password: !!downloadPassword,
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    if (tempPath) fs.unlink(tempPath, () => {});
    res.status(500).json({
      success: false,
      error: `Upload processing error: ${err.message}`,
    });
  }
}

// User API Key Management Endpoints
app.get('/api/user/api-key', async (req: Request, res: Response): Promise<void> => {
  let tgId = req.query.telegram_id as string;
  if (!tgId) {
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
  }
  if (!tgId) {
    res.status(401).json({ success: false, error: 'User not authenticated' });
    return;
  }
  const apiKey = await getUserApiKey(tgId);
  const activeWs = await getActiveWorkspaceFromDb(tgId);
  res.json({
    success: true,
    api_key: apiKey,
    telegram_id: tgId,
    workspace_id: activeWs?.id || 1,
    workspace_name: activeWs?.name || 'Default Workspace',
  });
});

app.post('/api/user/api-key/regenerate', async (req: Request, res: Response): Promise<void> => {
  let tgId = req.body.telegram_id as string;
  if (!tgId) {
    const statusRes = await forwardToPython('GET', '/status');
    tgId = statusRes.data?.user?.id;
  }
  if (!tgId) {
    res.status(401).json({ success: false, error: 'User not authenticated' });
    return;
  }
  const newApiKey = await regenerateUserApiKey(tgId);
  res.json({
    success: true,
    api_key: newApiKey,
    message: 'New API key generated successfully.',
  });
});

// External API Verification Endpoint
app.all('/api/v1/verify', async (req: Request, res: Response): Promise<void> => {
  const auth = await authenticateApiRequest(req);
  if (!auth.authenticated || !auth.user) {
    res.status(401).json({
      success: false,
      valid: false,
      error: auth.error || 'Invalid API key',
    });
    return;
  }
  const activeWs = await getActiveWorkspaceFromDb(auth.user.telegram_id);
  res.json({
    success: true,
    valid: true,
    auth_method: auth.authMethod,
    user: {
      telegram_id: auth.user.telegram_id,
      first_name: auth.user.first_name,
      username: auth.user.username,
    },
    workspace_id: activeWs?.id,
    workspace_name: activeWs?.name,
    message: 'API key and workspace integrity verified successfully.',
  });
});

// Mount File Upload endpoints (both /api/upload and /api/v1/upload)
app.post('/api/upload', handleUploadMiddleware, handleSecureUpload);
app.post('/api/v1/upload', handleUploadMiddleware, handleSecureUpload);

const CDN_CACHE_DIR = path.resolve(process.cwd(), 'data', 'cdn_cache');
if (!fs.existsSync(CDN_CACHE_DIR)) {
  fs.mkdirSync(CDN_CACHE_DIR, { recursive: true });
}

// Global High-Performance Public CDN Streaming Engine
async function streamCdnFile(
  messageId: string | number,
  req: Request,
  res: Response,
  options?: { customFileName?: string; downloadPassword?: string | null; storageChat?: string }
): Promise<void> {
  const msgId = String(messageId);

  // Set global public CDN CORS & caching headers for direct embedding & streaming
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type, Content-Disposition, ETag');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // 1. Resolve file metadata from MySQL if available
  let file = await getFileByMessageId(msgId);
  const fileName = options?.customFileName || file?.file_name || `file_${msgId}`;
  const mimeType = file?.mime_type || 'application/octet-stream';
  const targetStorageChat = options?.storageChat || file?.storage_chat || '';

  // 2. Check Password Protection
  const requiredPassword = options?.downloadPassword !== undefined ? options.downloadPassword : file?.download_password;
  if (requiredPassword) {
    const providedPassword = req.query.password || req.headers['x-download-password'] || '';
    if (providedPassword !== requiredPassword) {
      res.setHeader('Content-Type', 'text/html');
      res.status(403).send(`
        <!DOCTYPE html>
        <html lang="en" class="h-full">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Protected File - TeleCloud CDN</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-full p-4">
          <div class="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
            <h1 class="text-xl font-extrabold text-white">Password Protected File</h1>
            <p class="text-xs text-slate-400 truncate max-w-xs mx-auto">File: ${fileName}</p>
            <form method="GET" class="space-y-4">
              <input type="password" name="password" required placeholder="Enter download password" 
                class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-sky-500 text-center font-bold tracking-widest" />
              <button type="submit" 
                class="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm transition active:scale-95">
                Decrypt & Stream File
              </button>
            </form>
          </div>
        </body>
        </html>
      `);
      return;
    }
  }

  // 3. Check Local Disk Cache for Instant 0ms Latency CDN Delivery
  const cachePath = path.join(CDN_CACHE_DIR, `${msgId}.bin`);
  if (fs.existsSync(cachePath)) {
    try {
      const stat = fs.statSync(cachePath);
      if (stat.size > 0) {
        const range = req.headers.range;
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.setHeader('ETag', `"${msgId}-${stat.size}"`);

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          const chunksize = end - start + 1;
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
          res.setHeader('Content-Length', chunksize);

          if (req.method === 'HEAD') {
            res.end();
            return;
          }

          const fileStream = fs.createReadStream(cachePath, { start, end });
          fileStream.pipe(res);
          return;
        } else {
          res.status(200);
          res.setHeader('Content-Length', stat.size);

          if (req.method === 'HEAD') {
            res.end();
            return;
          }

          const fileStream = fs.createReadStream(cachePath);
          fileStream.pipe(res);
          return;
        }
      }
    } catch (cacheErr) {
      console.warn('[CDN Cache Read Error]', cacheErr);
    }
  }

  // 4. Stream directly from Telegram MTProto with Auto-Retry (User session with Admin fallback)
  let userSessionStr = '';
  if (file && file.telegram_id) {
    const ownerSession = await getUserTelegramSessionFromDb(file.telegram_id);
    if (ownerSession && !ownerSession.is_expired && ownerSession.session_status === 'active') {
      userSessionStr = ownerSession.session_str || '';
    }
  }

  const pyUrl = `${PY_BASE}/stream/${msgId}?storage_chat=${encodeURIComponent(targetStorageChat)}&session_str=${encodeURIComponent(userSessionStr)}`;
  const headers: Record<string, string> = {};
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  let pyRes: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      pyRes = await fetch(pyUrl, {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers,
      });
      if (pyRes.ok || pyRes.status === 206) {
        break;
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch (fetchErr) {
      if (attempt === 2) throw fetchErr;
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  if (!pyRes || (!pyRes.ok && pyRes.status !== 206)) {
    const errText = pyRes ? await pyRes.text() : 'Service Unavailable';
    res.status(pyRes ? pyRes.status : 503).send(errText);
    return;
  }

  res.status(pyRes.status);
  const contentType = pyRes.headers.get('content-type') || mimeType;
  const contentLength = pyRes.headers.get('content-length');
  const contentRange = pyRes.headers.get('content-range');
  const acceptRanges = pyRes.headers.get('accept-ranges') || 'bytes';
  const contentDisposition = pyRes.headers.get('content-disposition') || `inline; filename="${fileName}"`;

  res.setHeader('Content-Type', contentType);
  if (contentLength) res.setHeader('Content-Length', contentLength);
  if (contentRange) res.setHeader('Content-Range', contentRange);
  res.setHeader('Accept-Ranges', acceptRanges);
  res.setHeader('Content-Disposition', contentDisposition);

  if (req.method === 'HEAD' || !pyRes.body) {
    res.end();
    return;
  }

  // Write full downloads to CDN disk cache for future instant delivery
  let cacheStream: fs.WriteStream | null = null;
  const tmpCachePath = path.join(CDN_CACHE_DIR, `${msgId}.tmp`);
  if (pyRes.status === 200) {
    try {
      cacheStream = fs.createWriteStream(tmpCachePath);
    } catch {}
  }

  const reader = pyRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
      if (cacheStream) {
        cacheStream.write(value);
      }
    }
    res.end();
    if (cacheStream) {
      cacheStream.end();
      fs.rename(tmpCachePath, cachePath, () => {});
    }
  } catch (streamErr) {
    console.error('[CDN Stream Error]', streamErr);
    if (cacheStream) {
      cacheStream.end();
      fs.unlink(tmpCachePath, () => {});
    }
    res.end();
  }
}

// Direct Access Download / Stream Endpoints with CDN support
app.options(['/api/download/:messageId/:filename?', '/f/:file_id', '/stream/:message_id'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.status(204).end();
});

app.head('/api/download/:messageId/:filename?', async (req: Request, res: Response): Promise<void> => {
  await streamCdnFile(req.params.messageId, req, res, { customFileName: req.params.filename });
});

app.get('/api/download/:messageId/:filename?', async (req: Request, res: Response): Promise<void> => {
  await streamCdnFile(req.params.messageId, req, res, { customFileName: req.params.filename });
});

// Direct Shortlink Slug Service (s3.htknetwork.in/f/{file_id}) - Fully Public CDN
app.head('/f/:file_id', async (req: Request, res: Response): Promise<void> => {
  const { file_id } = req.params;
  let messageId = file_id;
  if (!/^\d+$/.test(file_id)) {
    const num = parseInt(file_id, 36);
    if (!isNaN(num)) messageId = String(num);
  }
  await streamCdnFile(messageId, req, res);
});

app.get('/f/:file_id', async (req: Request, res: Response): Promise<void> => {
  const { file_id } = req.params;
  let messageId = file_id;
  if (!/^\d+$/.test(file_id)) {
    const num = parseInt(file_id, 36);
    if (!isNaN(num)) messageId = String(num);
  }
  await streamCdnFile(messageId, req, res);
});

// Provide standalone Python script download
app.get('/api/script/download', (_req: Request, res: Response) => {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'telethon_uploader.py');
  if (fs.existsSync(scriptPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="telethon_uploader.py"');
    res.setHeader('Content-Type', 'text/x-python');
    fs.createReadStream(scriptPath).pipe(res);
  } else {
    res.status(404).send('Script not found');
  }
});

app.get('/api/script/raw', (_req: Request, res: Response) => {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'telethon_uploader.py');
  if (fs.existsSync(scriptPath)) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(fs.readFileSync(scriptPath, 'utf-8'));
  } else {
    res.status(404).send('Script not found');
  }
});

// Setup Vite or Static delivery
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[TeleCloud] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
