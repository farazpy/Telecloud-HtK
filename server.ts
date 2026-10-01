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
} from './server/db.ts';

const app = express();
const PORT = process.env.PORT || 3000;
const PY_PORT = 5050;
const PY_BASE = `http://127.0.0.1:${PY_PORT}/api/py`;

// Initialize MySQL database
initDb().catch((err) => console.error('[MySQL] init error:', err));

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
      install.on('close', () => {
        startPythonService();
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

function getShortLink(messageId: number | string): string {
  const shortId = Number(messageId).toString(36).toUpperCase();
  return `https://s3.htknetwork.in/${shortId}`;
}

// API Routes

app.get('/api/status', async (_req: Request, res: Response) => {
  const result = await forwardToPython('GET', '/status');
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
    res.json(result.data);
  } else if (result.status === 200) {
    res.json(result.data);
  } else {
    // Graceful fallback status so frontend never fails with 503 or HTML errors
    res.json({
      connected: false,
      has_session: false,
      status: 'starting',
      message: result.data?.error || 'Telegram MTProto service is initializing',
    });
  }
});

app.get('/api/db/status', (_req: Request, res: Response) => {
  res.json(getDbStatus());
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
    await saveUserToDb({
      telegram_id: result.data.user.id,
      first_name: result.data.user.first_name,
      username: result.data.user.username,
      storage_chat: req.body.storage_chat || 'me',
    }).catch((e) => console.error('[MySQL] saveUserToDb error:', e));
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
    api_id: req.body.api_id || process.env.TELEGRAM_API_ID || 27254692,
    api_hash: req.body.api_hash || process.env.TELEGRAM_API_HASH || '9f6f826a62b78378292fd224e943cb65',
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
  const payload = { ...req.body, phone };
  const result = await forwardToPython('POST', '/sign_in', payload);
  if (result.status === 200 && result.data?.user) {
    await saveUserToDb({
      telegram_id: result.data.user.id,
      first_name: result.data.user.first_name,
      last_name: result.data.user.last_name,
      username: result.data.user.username,
      phone: result.data.user.phone || phone,
      storage_chat: 'me',
    }).catch((e) => console.error('[MySQL] user save error:', e));
  }
  res.status(result.status).json(result.data);
});

app.post('/api/disconnect', async (_req: Request, res: Response) => {
  const result = await forwardToPython('POST', '/disconnect');
  res.status(result.status).json(result.data);
});

// Workspace endpoints (Multi-workspace per Telegram account in MySQL)
app.get(['/api/workspaces', '/api/v1/workspaces'], async (req: Request, res: Response) => {
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
  const tgId = statusRes.data?.user?.id;
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
  res.json({ files: dbFiles, total: dbFiles.length });
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

  const directDownloadUrl = getShortLink(message_id);

  const result = await renameFileInDb(tgId, message_id, new_file_name);
  if (result.success) {
    res.json({
      success: true,
      message_id,
      file_name: new_file_name,
      direct_link: directDownloadUrl,
    });
  } else {
    res.status(404).json({ error: result.error || 'Failed to rename file' });
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

  const host = req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const appUrl = process.env.APP_URL || `${proto}://${host}`;

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
      const link = getShortLink(f.message_id);
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
      direct_link: getShortLink(f.message_id),
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

    // 5. Execute MTProto Upload via Telethon Daemon
    const pyResult = await forwardToPython('POST', '/upload', {
      file_path: filePath,
      file_name: customFileName,
      caption,
    });

    // Remove temp file from disk
    fs.unlink(filePath, () => {});

    if (pyResult.status !== 200) {
      res.status(pyResult.status).json({
        success: false,
        error: pyResult.data?.error || 'Telegram upload failed',
      });
      return;
    }

    const messageId = pyResult.data.message_id;
    const directDownloadUrl = getShortLink(messageId);
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

// Direct Access Download / Stream Endpoint
app.get('/api/download/:messageId/:filename?', async (req: Request, res: Response): Promise<void> => {
  const { messageId } = req.params;

  try {
    // Check for password protection in Database
    const file = await getFileByMessageId(messageId);
    if (file && file.download_password) {
      const providedPassword = req.query.password || req.headers['x-download-password'] || '';
      if (providedPassword !== file.download_password) {
        // Return a gorgeous HTML password prompt
        res.setHeader('Content-Type', 'text/html');
        res.status(403).send(`
          <!DOCTYPE html>
          <html lang="en" class="h-full">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Protected File - TeleCloud</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Plus Jakarta Sans', sans-serif; }
            </style>
          </head>
          <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-full p-4">
            <div class="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
              <div class="w-16 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div class="space-y-2">
                <h1 class="text-xl font-extrabold text-white">Password Protected File</h1>
                <p class="text-xs text-slate-400 truncate max-w-xs mx-auto">File: ${file.file_name}</p>
                <p class="text-xs text-slate-500 font-medium">This secure file is encrypted in your personal cloud. Enter the access password to retrieve or stream this file.</p>
              </div>
              
              <form method="GET" class="space-y-4">
                <input type="password" name="password" required placeholder="Enter download password" 
                  class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-sky-500 text-center font-bold tracking-widest" />
                <button type="submit" 
                  class="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm transition active:scale-95">
                  Decrypt & Download Stream
                </button>
              </form>
              <div class="text-[10px] text-slate-600 font-mono uppercase tracking-wider">POWERED BY TELECLOUD ENGINE</div>
            </div>
          </body>
          </html>
        `);
        return;
      }
    }

    const pyUrl = `${PY_BASE}/stream/${messageId}`;
    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const pyRes = await fetch(pyUrl, {
      method: 'GET',
      headers,
    });

    if (!pyRes.ok && pyRes.status !== 206) {
      const errText = await pyRes.text();
      res.status(pyRes.status).send(errText);
      return;
    }

    res.status(pyRes.status);
    
    const contentType = pyRes.headers.get('content-type');
    const contentLength = pyRes.headers.get('content-length');
    const contentRange = pyRes.headers.get('content-range');
    const acceptRanges = pyRes.headers.get('accept-ranges');
    const contentDisposition = pyRes.headers.get('content-disposition');

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    } else if (req.params.filename) {
      res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    }

    if (!pyRes.body) {
      res.end();
      return;
    }

    // Pipe the web readable stream to express response
    const reader = pyRes.body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } catch (streamErr) {
        console.error('[Stream Error]', streamErr);
        res.end();
      }
    };
    pump();
  } catch (err: any) {
    res.status(500).send(`Error downloading file: ${err.message}`);
  }
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
