import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Key,
  RefreshCw,
  Copy,
  Check,
  Send,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  ShieldCheck,
  Code2,
  Trash2,
  Plus,
  Play,
  ArrowRight,
  Eye,
  FileCode,
  Download,
  Info,
  Sliders,
  Globe,
  HardDrive
} from 'lucide-react';

export interface ApiConsolePageProps {
  darkMode: boolean;
  cardBg: string;
  subCardBg: string;
  inputBg: string;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  } | null;
  userApiKey: string;
  activeWorkspace: {
    id: number;
    name: string;
    storage_chat?: string;
  } | null;
  workspaces: Array<{
    id: number;
    name: string;
    storage_chat?: string;
    file_count?: number;
  }>;
  onRegenerateApiKey: () => Promise<void>;
  regeneratingApiKey: boolean;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onRefreshFiles: () => void;
  onRefreshWorkspaces: () => void;
  onRefreshStats: () => void;
}

interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface EndpointDef {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  authRequired: boolean;
  bodyType: 'form-data' | 'json' | 'none';
  defaultHeaders?: Array<{ key: string; value: string }>;
  defaultParams?: Array<{ key: string; value: string }>;
  defaultFormData?: Array<{ key: string; value: string }>;
  defaultJson?: string;
  responseSample: any;
}

export const ApiConsolePage: React.FC<ApiConsolePageProps> = ({
  darkMode,
  cardBg,
  subCardBg,
  inputBg,
  user,
  userApiKey,
  activeWorkspace,
  workspaces,
  onRegenerateApiKey,
  regeneratingApiKey,
  onCopy,
  copiedId,
  onRefreshFiles,
  onRefreshWorkspaces,
  onRefreshStats,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const generateCurlForEndpoint = (ep: EndpointDef): string => {
    const fullPath = ep.path;
    let url = `${origin}${fullPath}`;
    
    // Append default query parameters if any
    if (ep.defaultParams && ep.defaultParams.length > 0) {
      const q = ep.defaultParams.map((p) => `${p.key}=${encodeURIComponent(p.value)}`).join('&');
      url = `${url}?${q}`;
    }

    let curl = `curl -X ${ep.method} "${url}"`;

    // Append Auth Headers
    if (ep.authRequired) {
      curl += ` \\\n  -H "x-api-key: ${userApiKey || 'tc_live_your_api_key'}"`;
    }

    // Append extra default headers
    if (ep.defaultHeaders) {
      ep.defaultHeaders.forEach((h) => {
        if (h.key.toLowerCase() !== 'x-api-key') {
          curl += ` \\\n  -H "${h.key}: ${h.value}"`;
        }
      });
    }

    // Append Request Body
    if (ep.method !== 'GET') {
      if (ep.bodyType === 'form-data') {
        curl += ` \\\n  -F "file=@/path/to/file.ext"`;
        if (ep.defaultFormData) {
          ep.defaultFormData.forEach((fd) => {
            curl += ` \\\n  -F "${fd.key}=${fd.value}"`;
          });
        }
      } else if (ep.bodyType === 'json' && ep.defaultJson) {
        curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${ep.defaultJson.replace(/'/g, "'\\''")}'`;
      }
    }

    return curl;
  };

  // API Key Visibility
  const [showKey, setShowKey] = useState<boolean>(false);
  const [verifyingKey, setVerifyingKey] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    valid?: boolean;
    message?: string;
    error?: string;
    auth_method?: string;
    workspace_name?: string;
  } | null>(null);

  // Postman Simulator State
  const [simMethod, setSimMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [simPath, setSimPath] = useState<string>('/api/v1/upload');
  const [simReqTab, setSimReqTab] = useState<'headers' | 'body' | 'params'>('body');
  const [simBodyType, setSimBodyType] = useState<'form-data' | 'json' | 'none'>('form-data');
  const [simCodeLang, setSimCodeLang] = useState<'curl' | 'js' | 'python'>('curl');

  const [simHeaders, setSimHeaders] = useState<KeyValueRow[]>([
    { id: 'h-1', key: 'x-api-key', value: userApiKey || '', enabled: true },
    { id: 'h-2', key: 'x-workspace-id', value: String(activeWorkspace?.id || 1), enabled: true },
  ]);

  const [simQueryParams, setSimQueryParams] = useState<KeyValueRow[]>([
    { id: 'p-1', key: 'workspace_id', value: String(activeWorkspace?.id || 1), enabled: false },
  ]);

  const [simFormData, setSimFormData] = useState<KeyValueRow[]>([
    { id: 'fd-1', key: 'workspace_id', value: String(activeWorkspace?.id || 1), enabled: true },
    { id: 'fd-2', key: 'caption', value: 'Uploaded via Postman API Simulator', enabled: true },
    { id: 'fd-3', key: 'file_name', value: '', enabled: false },
  ]);

  const [simFile, setSimFile] = useState<File | null>(null);
  const [simFileSha256, setSimFileSha256] = useState<string>('');
  const [simComputingHash, setSimComputingHash] = useState<boolean>(false);

  const [simJsonBody, setSimJsonBody] = useState<string>(
    JSON.stringify({ workspace_id: activeWorkspace?.id || 1 }, null, 2)
  );

  const [simSending, setSimSending] = useState<boolean>(false);
  const [simResponse, setSimResponse] = useState<{
    status: number;
    statusText: string;
    timeMs: number;
    sizeBytes: number;
    data: any;
    headers: Record<string, string>;
  } | null>(null);

  const [simRespTab, setSimRespTab] = useState<'body' | 'preview' | 'headers' | 'code'>('body');
  const [filterTag, setFilterTag] = useState<'all' | 'upload' | 'files' | 'workspaces' | 'auth'>('all');

  // Keep API key and workspace ID in sync when userApiKey changes
  useEffect(() => {
    if (userApiKey) {
      setSimHeaders((prev) =>
        prev.map((h) => (h.key.toLowerCase() === 'x-api-key' ? { ...h, value: userApiKey } : h))
      );
    }
  }, [userApiKey]);

  useEffect(() => {
    if (activeWorkspace?.id) {
      setSimHeaders((prev) =>
        prev.map((h) =>
          h.key.toLowerCase() === 'x-workspace-id' ? { ...h, value: String(activeWorkspace.id) } : h
        )
      );
      setSimFormData((prev) =>
        prev.map((fd) =>
          fd.key === 'workspace_id' ? { ...fd, value: String(activeWorkspace.id) } : fd
        )
      );
    }
  }, [activeWorkspace?.id]);

  // Real SHA-256 Calculation in browser for payload integrity
  const handleSimFileSelect = async (file: File | null) => {
    setSimFile(file);
    if (!file) {
      setSimFileSha256('');
      return;
    }
    setSimComputingHash(true);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setSimFileSha256(hashHex);
    } catch (e) {
      console.warn('Could not compute SHA-256 hash:', e);
      setSimFileSha256('');
    } finally {
      setSimComputingHash(false);
    }
  };

  // Add SHA-256 integrity header with 1-click
  const handleAttachIntegrityHeader = () => {
    if (!simFileSha256) return;
    setSimHeaders((prev) => {
      const exists = prev.find((h) => h.key.toLowerCase() === 'x-content-sha256');
      if (exists) {
        return prev.map((h) =>
          h.key.toLowerCase() === 'x-content-sha256' ? { ...h, value: simFileSha256, enabled: true } : h
        );
      }
      return [
        ...prev,
        { id: `h-${Date.now()}`, key: 'x-content-sha256', value: simFileSha256, enabled: true },
      ];
    });
    setSimReqTab('headers');
  };

  // Verify API Key
  const handleVerifyApiKey = async () => {
    setVerifyingKey(true);
    try {
      const res = await fetch(`${origin}/api/v1/verify`, {
        headers: {
          'x-api-key': userApiKey || '',
        },
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyResult({ success: false, error: err.message || 'Verification connection failed' });
    } finally {
      setVerifyingKey(false);
    }
  };

  // Send request in Simulator
  const handleExecuteRequest = async () => {
    setSimSending(true);
    const startTime = performance.now();

    try {
      let finalUrl = simPath.startsWith('http')
        ? simPath
        : `${origin}${simPath.startsWith('/') ? '' : '/'}${simPath}`;

      // Append enabled query params
      const activeParams = simQueryParams.filter((p) => p.enabled && p.key.trim());
      if (activeParams.length > 0) {
        const u = new URL(finalUrl, origin);
        for (const p of activeParams) {
          u.searchParams.set(p.key.trim(), p.value);
        }
        finalUrl = u.toString();
      }

      // Build Headers
      const headers: Record<string, string> = {};
      for (const h of simHeaders) {
        if (h.enabled && h.key.trim()) {
          headers[h.key.trim()] = h.value;
        }
      }

      let body: any = undefined;

      if (simMethod !== 'GET') {
        if (simBodyType === 'form-data') {
          const fd = new FormData();
          if (simFile) {
            fd.append('file', simFile);
          }
          for (const item of simFormData) {
            if (item.enabled && item.key.trim()) {
              fd.append(item.key.trim(), item.value);
            }
          }
          body = fd;
          // Let fetch compute multipart boundary automatically
          delete headers['Content-Type'];
          delete headers['content-type'];
        } else if (simBodyType === 'json') {
          body = simJsonBody;
          if (!headers['Content-Type'] && !headers['content-type']) {
            headers['Content-Type'] = 'application/json';
          }
        }
      }

      const res = await fetch(finalUrl, {
        method: simMethod,
        headers,
        body,
      });

      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);

      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        respHeaders[k] = v;
      });

      let respData: any = null;
      let rawText = '';
      try {
        rawText = await res.text();
        respData = JSON.parse(rawText);
      } catch {
        respData = rawText;
      }

      const sizeBytes = new Blob([rawText]).size;

      setSimResponse({
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        timeMs,
        sizeBytes,
        data: respData,
        headers: respHeaders,
      });

      // Auto switch to preview if direct link or file_url is returned!
      if (respData && (respData.file_url || respData.direct_link)) {
        setSimRespTab('preview');
      } else {
        setSimRespTab('body');
      }

      // Refresh files catalog if upload or file modification happened
      if (res.ok && (simPath.includes('upload') || simPath.includes('rename') || simPath.includes('reassign'))) {
        onRefreshFiles();
        onRefreshWorkspaces();
        onRefreshStats();
      }
    } catch (err: any) {
      const endTime = performance.now();
      setSimResponse({
        status: 0,
        statusText: 'Client Network Error',
        timeMs: Math.round(endTime - startTime),
        sizeBytes: 0,
        data: { error: err.message || 'Request execution failed' },
        headers: {},
      });
      setSimRespTab('body');
    } finally {
      setSimSending(false);
    }
  };

  // Pre-configured Endpoints Catalog
  const endpointsCatalog: EndpointDef[] = [
    {
      id: 'upload',
      method: 'POST',
      path: '/api/v1/upload',
      title: 'Upload File with Integrity (Returns file_url)',
      description:
        'Uploads a file directly to Telegram storage with API key authentication, target workspace assignment, optional SHA-256 checksum validation, and returns direct file_url in JSON.',
      authRequired: true,
      bodyType: 'form-data',
      defaultHeaders: [
        { key: 'x-api-key', value: userApiKey || '' },
        { key: 'x-workspace-id', value: String(activeWorkspace?.id || 1) },
      ],
      defaultFormData: [
        { key: 'workspace_id', value: String(activeWorkspace?.id || 1) },
        { key: 'caption', value: 'Uploaded via TeleCloud API' },
        { key: 'file_name', value: '' },
      ],
      responseSample: {
        success: true,
        file_url: `${origin}/api/download/305452/document.pdf`,
        direct_link: `${origin}/api/download/305452/document.pdf`,
        message_id: 305452,
        file_name: 'document.pdf',
        original_name: 'document.pdf',
        file_size: 1048576,
        mime_type: 'application/pdf',
        workspace_id: activeWorkspace?.id || 1,
        workspace_name: activeWorkspace?.name || 'Default Workspace',
        caption: 'Uploaded via TeleCloud API',
        checksum_sha256: 'b9374bcceca3d1413fa6a958e67725c96157f290da65ab9267b48c95b8f9613f',
        telegram_link: 'https://t.me/me',
        created_at: '2026-10-01T01:00:00.000Z',
      },
    },
    {
      id: 'verify',
      method: 'GET',
      path: '/api/v1/verify',
      title: 'Verify API Key & Workspace Integrity',
      description:
        'Validates that the provided user API key is genuine, active in MySQL, and retrieves the linked Telegram user account and default workspace.',
      authRequired: true,
      bodyType: 'none',
      defaultHeaders: [{ key: 'x-api-key', value: userApiKey || '' }],
      responseSample: {
        success: true,
        valid: true,
        auth_method: 'api_key',
        user: {
          telegram_id: String(user?.id || '12345678'),
          first_name: user?.first_name || 'Faraz',
          username: user?.username || 'user',
        },
        workspace_id: activeWorkspace?.id || 1,
        workspace_name: activeWorkspace?.name || 'Default Workspace',
        message: 'API key and workspace integrity verified successfully.',
      },
    },
    {
      id: 'list-files',
      method: 'GET',
      path: '/api/v1/files',
      title: 'List Files in Vault Catalog',
      description:
        'Retrieves catalog files owned by the authenticated user. Optionally filter by workspace_id query parameter.',
      authRequired: true,
      bodyType: 'none',
      defaultHeaders: [{ key: 'x-api-key', value: userApiKey || '' }],
      defaultParams: [{ key: 'workspace_id', value: String(activeWorkspace?.id || 1) }],
      responseSample: {
        total: 1,
        files: [
          {
            id: 1,
            message_id: 305452,
            workspace_id: activeWorkspace?.id || 1,
            workspace_name: activeWorkspace?.name || 'Default Workspace',
            file_name: 'document.pdf',
            file_size: 1048576,
            mime_type: 'application/pdf',
            direct_link: `${origin}/api/download/305452/document.pdf`,
          },
        ],
      },
    },
    {
      id: 'list-workspaces',
      method: 'GET',
      path: '/api/v1/workspaces',
      title: 'List Workspaces & Active Target',
      description:
        'Lists all MySQL workspaces associated with the authenticated Telegram account and returns the currently active workspace.',
      authRequired: true,
      bodyType: 'none',
      defaultHeaders: [{ key: 'x-api-key', value: userApiKey || '' }],
      responseSample: {
        workspaces: workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          storage_chat: w.storage_chat,
          file_count: w.file_count || 0,
        })),
        active_workspace_id: activeWorkspace?.id || 1,
      },
    },
    {
      id: 'get-key',
      method: 'GET',
      path: '/api/user/api-key',
      title: 'Get User API Key & Workspace',
      description:
        'Retrieves current API key credentials and active workspace ID for the logged in session.',
      authRequired: false,
      bodyType: 'none',
      responseSample: {
        success: true,
        api_key: userApiKey || 'tc_live_...',
        telegram_id: String(user?.id || '12345678'),
        workspace_id: activeWorkspace?.id || 1,
        workspace_name: activeWorkspace?.name || 'Default Workspace',
      },
    },
    {
      id: 'regenerate-key',
      method: 'POST',
      path: '/api/user/api-key/regenerate',
      title: 'Regenerate API Key',
      description:
        'Invalidates existing API key and issues a fresh high-entropy production key.',
      authRequired: false,
      bodyType: 'json',
      defaultJson: JSON.stringify({ telegram_id: user?.id }, null, 2),
      responseSample: {
        success: true,
        api_key: 'tc_live_7e8b91c045b3...',
        message: 'New API key generated successfully.',
      },
    },
    {
      id: 'rename-file',
      method: 'POST',
      path: '/api/files/rename',
      title: 'Rename File in Vault Catalog',
      description:
        'Renames an existing file in MySQL catalog and generates an updated direct download URL.',
      authRequired: true,
      bodyType: 'json',
      defaultHeaders: [{ key: 'x-api-key', value: userApiKey || '' }],
      defaultJson: JSON.stringify(
        {
          message_id: 305452,
          new_file_name: 'renamed_document.pdf',
        },
        null,
        2
      ),
      responseSample: {
        success: true,
        message_id: 305452,
        new_file_name: 'renamed_document.pdf',
        direct_link: `${origin}/api/download/305452/renamed_document.pdf`,
      },
    },
    {
      id: 'reassign-file',
      method: 'POST',
      path: '/api/files/reassign',
      title: 'Reassign File to Workspace',
      description:
        'Moves a file record to a different workspace connected to the user account.',
      authRequired: true,
      bodyType: 'json',
      defaultHeaders: [{ key: 'x-api-key', value: userApiKey || '' }],
      defaultJson: JSON.stringify(
        {
          message_id: 305452,
          target_workspace_id: activeWorkspace?.id || 1,
        },
        null,
        2
      ),
      responseSample: {
        success: true,
        message_id: 305452,
        workspace_id: activeWorkspace?.id || 1,
        workspace_name: activeWorkspace?.name || 'Default Workspace',
      },
    },
    {
      id: 'manifest',
      method: 'GET',
      path: '/api/manifest',
      title: 'Batch Manifest Direct Download Links',
      description:
        'Generates an exportable JSON manifest with direct download links and checksums for multiple message IDs.',
      authRequired: false,
      bodyType: 'none',
      defaultParams: [{ key: 'ids', value: '305452,305453' }],
      responseSample: {
        total_files: 2,
        total_size: 2097152,
        files: [
          {
            message_id: 305452,
            file_name: 'document.pdf',
            direct_link: `${origin}/api/download/305452/document.pdf`,
          },
        ],
      },
    },
  ];

  // Load an endpoint definition into the simulator
  const handleLoadEndpointIntoSimulator = (ep: EndpointDef) => {
    setSimMethod(ep.method);
    setSimPath(ep.path);
    setSimBodyType(ep.bodyType);

    // Populate headers
    const newHeaders: KeyValueRow[] = [
      { id: 'h-1', key: 'x-api-key', value: userApiKey || '', enabled: ep.authRequired },
      { id: 'h-2', key: 'x-workspace-id', value: String(activeWorkspace?.id || 1), enabled: true },
    ];
    if (ep.defaultHeaders) {
      ep.defaultHeaders.forEach((h, idx) => {
        if (!newHeaders.some((nh) => nh.key.toLowerCase() === h.key.toLowerCase())) {
          newHeaders.push({
            id: `h-custom-${idx}`,
            key: h.key,
            value: h.value,
            enabled: true,
          });
        }
      });
    }
    setSimHeaders(newHeaders);

    // Populate params
    if (ep.defaultParams) {
      setSimQueryParams(
        ep.defaultParams.map((p, idx) => ({
          id: `p-${idx}`,
          key: p.key,
          value: p.value,
          enabled: true,
        }))
      );
    } else {
      setSimQueryParams([]);
    }

    // Populate form data
    if (ep.defaultFormData) {
      setSimFormData(
        ep.defaultFormData.map((fd, idx) => ({
          id: `fd-${idx}`,
          key: fd.key,
          value: fd.value,
          enabled: true,
        }))
      );
    }

    // Populate JSON
    if (ep.defaultJson) {
      setSimJsonBody(ep.defaultJson);
    }

    // Switch tab
    if (ep.bodyType === 'form-data' || ep.bodyType === 'json') {
      setSimReqTab('body');
    } else if (ep.defaultParams && ep.defaultParams.length > 0) {
      setSimReqTab('params');
    } else {
      setSimReqTab('headers');
    }

    // Smooth scroll up to simulator
    const el = document.getElementById('postman-simulator-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate Code Snippets for Current Request Configuration
  const getGeneratedCodeSnippet = () => {
    let finalUrl = simPath.startsWith('http')
      ? simPath
      : `${origin}${simPath.startsWith('/') ? '' : '/'}${simPath}`;

    const activeParams = simQueryParams.filter((p) => p.enabled && p.key.trim());
    if (activeParams.length > 0) {
      const u = new URL(finalUrl, origin);
      for (const p of activeParams) {
        u.searchParams.set(p.key.trim(), p.value);
      }
      finalUrl = u.toString();
    }

    const enabledHeaders = simHeaders.filter((h) => h.enabled && h.key.trim());

    if (simCodeLang === 'curl') {
      const headerFlags = enabledHeaders.map((h) => `  -H "${h.key}: ${h.value}" \\\n`).join('');
      if (simMethod === 'GET') {
        return `curl -X GET "${finalUrl}" \\\n${headerFlags}`.trim().replace(/\\\n$/, '');
      }
      if (simBodyType === 'form-data') {
        let fdFlags = `  -F "file=@/path/to/your/file.ext" \\\n`;
        for (const fd of simFormData.filter((f) => f.enabled && f.key.trim())) {
          fdFlags += `  -F "${fd.key}=${fd.value}" \\\n`;
        }
        return `curl -X ${simMethod} "${finalUrl}" \\\n${headerFlags}${fdFlags}`.trim().replace(/\\\n$/, '');
      }
      if (simBodyType === 'json') {
        const compactJson = JSON.stringify(JSON.parse(simJsonBody || '{}'));
        return `curl -X ${simMethod} "${finalUrl}" \\\n${headerFlags}  -H "Content-Type: application/json" \\\n  -d '${compactJson}'`;
      }
      return `curl -X ${simMethod} "${finalUrl}" \\\n${headerFlags}`.trim().replace(/\\\n$/, '');
    }

    if (simCodeLang === 'js') {
      const headerObj: Record<string, string> = {};
      enabledHeaders.forEach((h) => {
        headerObj[h.key] = h.value;
      });

      if (simMethod === 'GET') {
        return `const response = await fetch("${finalUrl}", {
  method: "GET",
  headers: ${JSON.stringify(headerObj, null, 2)}
});
const data = await response.json();
console.log(data);`;
      }

      if (simBodyType === 'form-data') {
        return `const formData = new FormData();
formData.append("file", fileInputElement.files[0]);
${simFormData
  .filter((f) => f.enabled && f.key.trim())
  .map((f) => `formData.append("${f.key}", "${f.value}");`)
  .join('\n')}

const response = await fetch("${finalUrl}", {
  method: "${simMethod}",
  headers: {
    "x-api-key": "${userApiKey || 'YOUR_API_KEY'}",
    "x-workspace-id": "${activeWorkspace?.id || 1}"
  },
  body: formData
});
const data = await response.json();
console.log("Direct File URL:", data.file_url);`;
      }

      return `const response = await fetch("${finalUrl}", {
  method: "${simMethod}",
  headers: {
    ...${JSON.stringify(headerObj, null, 2)},
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${simJsonBody || '{}'})
});
const data = await response.json();
console.log(data);`;
    }

    if (simCodeLang === 'python') {
      const headerDict = enabledHeaders.map((h) => `    "${h.key}": "${h.value}"`).join(',\n');
      if (simMethod === 'GET') {
        return `import requests

url = "${finalUrl}"
headers = {
${headerDict}
}

response = requests.get(url, headers=headers)
print(response.json())`;
      }

      if (simBodyType === 'form-data') {
        return `import requests

url = "${finalUrl}"
headers = {
    "x-api-key": "${userApiKey || 'YOUR_API_KEY'}",
    "x-workspace-id": "${activeWorkspace?.id || 1}"
}

files = {
    "file": open("/path/to/your/file.ext", "rb")
}
data = {
${simFormData
  .filter((f) => f.enabled && f.key.trim())
  .map((f) => `    "${f.key}": "${f.value}"`)
  .join(',\n')}
}

response = requests.post(url, headers=headers, files=files, data=data)
res_json = response.json()
print("Direct File URL:", res_json.get("file_url"))`;
      }

      return `import requests

url = "${finalUrl}"
headers = {
${headerDict},
    "Content-Type": "application/json"
}
payload = ${simJsonBody || '{}'}

response = requests.request("${simMethod}", url, headers=headers, json=payload)
print(response.json())`;
    }

    return '';
  };

  const filteredEndpoints = endpointsCatalog.filter((ep) => {
    if (filterTag === 'all') return true;
    if (filterTag === 'upload') return ep.id === 'upload';
    if (filterTag === 'files') return ep.id === 'list-files' || ep.id === 'rename-file' || ep.id === 'manifest';
    if (filterTag === 'workspaces') return ep.id === 'list-workspaces' || ep.id === 'reassign-file';
    if (filterTag === 'auth') return ep.id === 'verify' || ep.id === 'get-key' || ep.id === 'regenerate-key';
    return true;
  });

  return (
    <div className="space-y-7 pb-12">
      {/* PAGE HEADER */}
      <div className={`p-6 sm:p-7 rounded-3xl transition-colors duration-200 border ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  API Console & Simulator
                </h1>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Interactive Postman simulator, SHA-256 payload integrity check, and REST API directory
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-2 ${
              darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <Globe className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{origin}</span>
              <button
                onClick={() => onCopy(origin, 'base-url')}
                className="hover:text-indigo-400 transition"
                title="Copy Base URL"
              >
                {copiedId === 'base-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>v1 REST API Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: USER API KEY GENERATION & INTEGRITY CONTROLS */}
      <div className={`p-6 sm:p-7 rounded-3xl space-y-5 transition-colors duration-200 border ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <h2 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                API Authentication & Key Management
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Pass your API key in the <code className="font-mono text-indigo-400 font-bold">x-api-key</code> header or Bearer authorization
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleVerifyApiKey}
              disabled={verifyingKey || !userApiKey}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 text-emerald-400 ${verifyingKey ? 'animate-spin' : ''}`} />
              <span>{verifyingKey ? 'Verifying...' : 'Verify Key & Integrity'}</span>
            </button>

            <button
              onClick={onRegenerateApiKey}
              disabled={regeneratingApiKey}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regeneratingApiKey ? 'animate-spin' : ''}`} />
              <span>{regeneratingApiKey ? 'Generating...' : 'Regenerate API Key'}</span>
            </button>
          </div>
        </div>

        {/* API Key Box */}
        <div className={`p-4 sm:p-5 rounded-2xl space-y-3.5 ${subCardBg}`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={userApiKey || 'Loading API key...'}
                className={`w-full rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono font-bold select-all ${inputBg}`}
                placeholder="tc_live_..."
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                {showKey ? 'Hide' : 'Reveal'}
              </button>
            </div>

            <button
              onClick={() => onCopy(userApiKey, 'user-api-key')}
              disabled={!userApiKey}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95"
            >
              {copiedId === 'user-api-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'user-api-key' ? 'Copied Key!' : 'Copy API Key'}</span>
            </button>
          </div>

          {/* Account & Workspace Metadata Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
              darkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">Telegram Account:</span>
              <strong className="font-mono text-sky-400 truncate">#{user?.id || 'Connected'}</strong>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
              darkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Workspace:</span>
              <strong className="text-purple-400 truncate font-semibold">
                ID #{activeWorkspace?.id || 1} ({activeWorkspace?.name || 'Default'})
              </strong>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
              darkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">Storage Target:</span>
              <strong className="text-emerald-400 truncate font-semibold">
                {activeWorkspace?.storage_chat === 'me' ? 'Self (Saved Messages)' : activeWorkspace?.storage_chat || 'Self'}
              </strong>
            </div>
          </div>

          {/* Key Verification Output */}
          {verifyResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between border animate-in fade-in duration-200 ${
                verifyResult.success
                  ? darkMode
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : darkMode
                  ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                {verifyResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span className="font-semibold">
                  {verifyResult.message || verifyResult.error || 'Verification completed'}
                </span>
              </div>
              <button
                onClick={() => setVerifyResult(null)}
                className="text-[10px] underline font-bold opacity-75 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: REAL SIMULATOR LIKE POSTMAN */}
      <div
        id="postman-simulator-container"
        className={`p-6 sm:p-7 rounded-3xl space-y-6 transition-colors duration-200 border scroll-mt-20 ${cardBg}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-sky-400" />
              <h2 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Real API Request Simulator (Postman Mode)
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Construct live HTTP requests, test file uploads with SHA-256 integrity, inspect JSON responses and live previews
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-medium">Quick Preset:</span>
            <select
              onChange={(e) => {
                const ep = endpointsCatalog.find((x) => x.id === e.target.value);
                if (ep) handleLoadEndpointIntoSimulator(ep);
              }}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${inputBg}`}
              defaultValue=""
            >
              <option value="" disabled>
                Select Endpoint Template...
              </option>
              {endpointsCatalog.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.method} {ep.path}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* POSTMAN URL BAR & METHOD PICKER */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            {/* Method Dropdown */}
            <div className="flex-shrink-0">
              <select
                value={simMethod}
                onChange={(e) => setSimMethod(e.target.value as any)}
                aria-label="HTTP Method"
                className={`w-full md:w-32 rounded-xl px-3 py-3 text-xs font-black tracking-wider uppercase border transition ${
                  simMethod === 'POST'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/40'
                    : simMethod === 'GET'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                    : simMethod === 'PUT'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/40'
                }`}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {/* URL Bar */}
            <div className="relative flex-1 flex items-center">
              <span
                className={`hidden sm:inline-block px-3 py-3 text-xs font-mono font-bold rounded-l-xl border-y border-l select-none ${
                  darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {origin}
              </span>
              <input
                type="text"
                value={simPath}
                onChange={(e) => setSimPath(e.target.value)}
                placeholder="/api/v1/upload"
                aria-label="API Endpoint Path"
                className={`w-full rounded-xl sm:rounded-l-none sm:rounded-r-xl px-3.5 py-3 text-xs font-mono font-bold ${inputBg}`}
              />
            </div>

            {/* Send Request Button */}
            <button
              onClick={handleExecuteRequest}
              disabled={simSending}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-sky-500/20 flex items-center justify-center space-x-2 transition active:scale-95 flex-shrink-0"
            >
              {simSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* REQUEST CONFIGURATION TABS (Headers, Body, Params) */}
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`flex items-center border-b px-3 text-xs font-bold ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
            <button
              onClick={() => setSimReqTab('headers')}
              className={`py-3 px-4 border-b-2 transition flex items-center space-x-1.5 ${
                simReqTab === 'headers'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Headers</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {simHeaders.filter((h) => h.enabled).length}
              </span>
            </button>

            <button
              onClick={() => setSimReqTab('body')}
              className={`py-3 px-4 border-b-2 transition flex items-center space-x-1.5 ${
                simReqTab === 'body'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Body</span>
              {simBodyType !== 'none' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-400 font-mono">
                  {simBodyType}
                </span>
              )}
            </button>

            <button
              onClick={() => setSimReqTab('params')}
              className={`py-3 px-4 border-b-2 transition flex items-center space-x-1.5 ${
                simReqTab === 'params'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Params</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {simQueryParams.filter((p) => p.enabled).length}
              </span>
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {/* SUB-PANEL 1: HEADERS */}
            {simReqTab === 'headers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Request Headers (Key-Value):
                  </span>
                  <button
                    onClick={() =>
                      setSimHeaders((prev) => [
                        ...prev,
                        { id: `h-${Date.now()}`, key: '', value: '', enabled: true },
                      ])
                    }
                    className="text-xs text-sky-400 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Header</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {simHeaders.map((row) => (
                    <div key={row.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) =>
                          setSimHeaders((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, enabled: e.target.checked } : r))
                          )
                        }
                        className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) =>
                          setSimHeaders((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r))
                          )
                        }
                        placeholder="Header (e.g. x-api-key)"
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) =>
                          setSimHeaders((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                          )
                        }
                        placeholder="Value"
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                      />
                      <button
                        onClick={() => setSimHeaders((prev) => prev.filter((r) => r.id !== row.id))}
                        className={`p-2 rounded-lg text-slate-400 hover:text-rose-400 transition ${
                          darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                        }`}
                        title="Remove header"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-PANEL 2: BODY */}
            {simReqTab === 'body' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 text-xs font-bold border-b pb-3 border-slate-200 dark:border-slate-800">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value="form-data"
                      checked={simBodyType === 'form-data'}
                      onChange={() => setSimBodyType('form-data')}
                      className="accent-indigo-500"
                    />
                    <span>multipart/form-data (File Upload + Integrity)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value="json"
                      checked={simBodyType === 'json'}
                      onChange={() => setSimBodyType('json')}
                      className="accent-indigo-500"
                    />
                    <span>application/json</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value="none"
                      checked={simBodyType === 'none'}
                      onChange={() => setSimBodyType('none')}
                      className="accent-indigo-500"
                    />
                    <span>none</span>
                  </label>
                </div>

                {/* FORM DATA MODE */}
                {simBodyType === 'form-data' && (
                  <div className="space-y-4">
                    {/* File Attachment & Integrity Hash calculation */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            Select File to Attach (<code className="text-sky-400 font-mono">file</code> parameter):
                          </label>
                          <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Any document, image, audio, video, or archive. SHA-256 payload integrity is calculated automatically.
                          </p>
                        </div>

                        <div>
                          <input
                            type="file"
                            id="sim-file-input"
                            className="hidden"
                            onChange={(e) => handleSimFileSelect(e.target.files?.[0] || null)}
                          />
                          <label
                            htmlFor="sim-file-input"
                            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center space-x-1.5 transition"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{simFile ? 'Replace File...' : 'Choose File...'}</span>
                          </label>
                        </div>
                      </div>

                      {simFile && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold truncate text-sky-400">{simFile.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {(simFile.size / 1024).toFixed(1)} KB ({simFile.type || 'application/octet-stream'})
                            </span>
                          </div>

                          {/* Calculated SHA-256 Integrity Hash */}
                          <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                            darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            <div className="truncate pr-2">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Calculated SHA-256 Integrity:</span>
                              <span className="text-emerald-400 font-semibold truncate block">
                                {simComputingHash ? 'Calculating hash...' : simFileSha256 || 'Hash ready'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={handleAttachIntegrityHeader}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition flex-shrink-0"
                            >
                              + Attach as x-content-sha256
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Form Fields */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Form Parameters (Key-Value):
                        </span>
                        <button
                          onClick={() =>
                            setSimFormData((prev) => [
                              ...prev,
                              { id: `fd-${Date.now()}`, key: '', value: '', enabled: true },
                            ])
                          }
                          className="text-xs text-sky-400 font-semibold hover:underline flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Field</span>
                        </button>
                      </div>

                      {simFormData.map((row) => (
                        <div key={row.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) =>
                              setSimFormData((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, enabled: e.target.checked } : r))
                              )
                            }
                            className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={row.key}
                            onChange={(e) =>
                              setSimFormData((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r))
                              )
                            }
                            placeholder="Key (e.g. caption, workspace_id)"
                            className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                          />
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) =>
                              setSimFormData((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                              )
                            }
                            placeholder="Value"
                            className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                          />
                          <button
                            onClick={() => setSimFormData((prev) => prev.filter((r) => r.id !== row.id))}
                            className={`p-2 rounded-lg text-slate-400 hover:text-rose-400 transition ${
                              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                            }`}
                            title="Remove field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* JSON BODY MODE */}
                {simBodyType === 'json' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        JSON Body (application/json):
                      </span>
                      <button
                        onClick={() => {
                          try {
                            const formatted = JSON.stringify(JSON.parse(simJsonBody), null, 2);
                            setSimJsonBody(formatted);
                          } catch (e) {
                            // ignore invalid json
                          }
                        }}
                        className="text-xs text-sky-400 font-semibold hover:underline"
                      >
                        Format / Beautify JSON
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={simJsonBody}
                      onChange={(e) => setSimJsonBody(e.target.value)}
                      className={`w-full rounded-xl p-3.5 text-xs font-mono font-medium leading-relaxed ${inputBg}`}
                      placeholder='{ "key": "value" }'
                    />
                  </div>
                )}

                {simBodyType === 'none' && (
                  <p className="text-xs text-slate-400 py-3 text-center italic">
                    This request does not include a body payload.
                  </p>
                )}
              </div>
            )}

            {/* SUB-PANEL 3: QUERY PARAMS */}
            {simReqTab === 'params' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    URL Query Parameters (Appended to ?key=value):
                  </span>
                  <button
                    onClick={() =>
                      setSimQueryParams((prev) => [
                        ...prev,
                        { id: `p-${Date.now()}`, key: '', value: '', enabled: true },
                      ])
                    }
                    className="text-xs text-sky-400 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Param</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {simQueryParams.map((row) => (
                    <div key={row.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) =>
                          setSimQueryParams((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, enabled: e.target.checked } : r))
                          )
                        }
                        className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) =>
                          setSimQueryParams((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r))
                          )
                        }
                        placeholder="Parameter Name"
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) =>
                          setSimQueryParams((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                          )
                        }
                        placeholder="Parameter Value"
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                      />
                      <button
                        onClick={() => setSimQueryParams((prev) => prev.filter((r) => r.id !== row.id))}
                        className={`p-2 rounded-lg text-slate-400 hover:text-rose-400 transition ${
                          darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                        }`}
                        title="Remove parameter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RESPONSE INSPECTOR (POSTMAN STYLE) */}
        {simResponse && (
          <div className={`rounded-2xl border overflow-hidden animate-in fade-in duration-200 ${
            darkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
          }`}>
            {/* Response Status Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 border-b ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                    simResponse.status >= 200 && simResponse.status < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : simResponse.status >= 400 && simResponse.status < 500
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  Status: {simResponse.status} {simResponse.statusText}
                </span>

                <span className="text-xs font-mono text-slate-400">
                  Time: <strong className="text-emerald-400">{simResponse.timeMs} ms</strong>
                </span>

                <span className="text-xs font-mono text-slate-400">
                  Size: <strong className="text-sky-400">{simResponse.sizeBytes} B</strong>
                </span>
              </div>

              {/* Response Sub-Tabs */}
              <div className="flex items-center space-x-1 text-xs font-bold">
                <button
                  onClick={() => setSimRespTab('body')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    simRespTab === 'body'
                      ? 'bg-indigo-600 text-white'
                      : darkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  JSON Response
                </button>

                {(simResponse.data?.file_url || simResponse.data?.direct_link) && (
                  <button
                    onClick={() => setSimRespTab('preview')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                      simRespTab === 'preview'
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <span>Direct File URL</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>
                )}

                <button
                  onClick={() => setSimRespTab('headers')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    simRespTab === 'headers'
                      ? 'bg-indigo-600 text-white'
                      : darkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Headers ({Object.keys(simResponse.headers).length})
                </button>

                <button
                  onClick={() => setSimRespTab('code')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    simRespTab === 'code'
                      ? 'bg-indigo-600 text-white'
                      : darkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Code Snippet
                </button>

                <button
                  onClick={() =>
                    onCopy(
                      typeof simResponse.data === 'object'
                        ? JSON.stringify(simResponse.data, null, 2)
                        : String(simResponse.data),
                      'sim-resp'
                    )
                  }
                  className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition ${
                    darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
                  }`}
                  title="Copy Raw Response"
                >
                  {copiedId === 'sim-resp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* TAB: JSON RESPONSE BODY */}
            {simRespTab === 'body' && (
              <div className="p-4 overflow-x-auto">
                <pre className={`text-xs font-mono leading-relaxed p-4 rounded-xl ${
                  darkMode ? 'bg-slate-950 text-sky-300' : 'bg-slate-900 text-sky-200'
                }`}>
                  {typeof simResponse.data === 'object'
                    ? JSON.stringify(simResponse.data, null, 2)
                    : String(simResponse.data)}
                </pre>
              </div>
            )}

            {/* TAB: DIRECT FILE PREVIEW (HIGHLIGHTING file_url AS REQUESTED) */}
            {simRespTab === 'preview' && (simResponse.data?.file_url || simResponse.data?.direct_link) && (
              <div className="p-5 space-y-4">
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  darkMode ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-extrabold text-sm">Direct File URL Verified & Ready</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono">
                      Telegram MTProto Stream
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={simResponse.data.file_url || simResponse.data.direct_link}
                      className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold select-all ${inputBg}`}
                    />
                    <button
                      onClick={() =>
                        onCopy(simResponse.data.file_url || simResponse.data.direct_link, 'sim-direct-url')
                      }
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition flex-shrink-0"
                    >
                      {copiedId === 'sim-direct-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'sim-direct-url' ? 'Copied!' : 'Copy file_url'}</span>
                    </button>
                    <a
                      href={simResponse.data.file_url || simResponse.data.direct_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Link</span>
                    </a>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-400 block text-[9px] uppercase">File Name:</span>
                      <strong className="truncate block">{simResponse.data.file_name}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-400 block text-[9px] uppercase">File Size:</span>
                      <strong>{(Number(simResponse.data.file_size || 0) / 1024).toFixed(1)} KB</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-400 block text-[9px] uppercase">Message ID:</span>
                      <strong>#{simResponse.data.message_id}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-400 block text-[9px] uppercase">Workspace:</span>
                      <strong className="truncate block">{simResponse.data.workspace_name || `#${simResponse.data.workspace_id}`}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RESPONSE HEADERS */}
            {simRespTab === 'headers' && (
              <div className="p-4 space-y-1">
                {Object.entries(simResponse.headers).map(([k, v]) => (
                  <div
                    key={k}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono ${
                      darkMode ? 'hover:bg-slate-900' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-indigo-400 font-bold">{k}</span>
                    <span className="text-slate-400 truncate max-w-md">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: CODE SNIPPET */}
            {simRespTab === 'code' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSimCodeLang('curl')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        simCodeLang === 'curl' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setSimCodeLang('js')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        simCodeLang === 'js' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      JavaScript (Fetch)
                    </button>
                    <button
                      onClick={() => setSimCodeLang('python')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        simCodeLang === 'python' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Python (Requests)
                    </button>
                  </div>

                  <button
                    onClick={() => onCopy(getGeneratedCodeSnippet(), 'sim-snippet')}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1"
                  >
                    {copiedId === 'sim-snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'sim-snippet' ? 'Copied' : 'Copy Snippet'}</span>
                  </button>
                </div>

                <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed ${
                  darkMode ? 'bg-slate-950 text-sky-300' : 'bg-slate-900 text-sky-200'
                }`}>
                  {getGeneratedCodeSnippet()}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: ALL ENDPOINTS CATALOG (POSTMAN COLLECTION STYLE) */}
      <div className={`p-6 sm:p-7 rounded-3xl space-y-6 transition-colors duration-200 border ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <h2 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Endpoints Directory ({endpointsCatalog.length} Endpoints)
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Click "Load in Simulator" on any endpoint to instantly pre-fill and execute requests
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            {(['all', 'upload', 'files', 'workspaces', 'auth'] as const).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition ${
                  filterTag === tag
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : darkMode
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        <div className="space-y-4">
          {filteredEndpoints.map((ep) => (
            <div
              key={ep.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:border-indigo-500/40 space-y-3 ${subCardBg}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 flex-wrap">
                  <span
                    className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${
                      ep.method === 'POST'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : ep.method === 'GET'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : ep.method === 'PUT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {ep.method}
                  </span>

                  <span className={`font-mono text-xs sm:text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {ep.path}
                  </span>

                  {ep.authRequired ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      API Key Required
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      Public / Session
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleLoadEndpointIntoSimulator(ep)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
                >
                  <Play className="w-3 h-3" />
                  <span>Load in Simulator</span>
                </button>
              </div>

              <div>
                <h4 className={`text-xs font-extrabold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {ep.title}
                </h4>
                <p className={`text-xs mt-0.5 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {ep.description}
                </p>
              </div>

              {/* Grid of Request Code & Response Sample */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* cURL Request Example */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold uppercase flex items-center space-x-1">
                      <Terminal className="w-3 h-3 text-indigo-400" />
                      <span>cURL Request Example:</span>
                    </span>
                    <button
                      onClick={() => onCopy(generateCurlForEndpoint(ep), `curl-${ep.id}`)}
                      className="text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
                    >
                      {copiedId === `curl-${ep.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === `curl-${ep.id}` ? 'Copied' : 'Copy cURL'}</span>
                    </button>
                  </div>
                  <pre className={`p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-36 ${
                    darkMode ? 'bg-slate-950 text-amber-300 border border-slate-800/80' : 'bg-slate-900 text-amber-200 border border-slate-800'
                  }`}>
                    {generateCurlForEndpoint(ep)}
                  </pre>
                </div>

                {/* Sample Response Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold uppercase">JSON Response Sample:</span>
                    <button
                      onClick={() => onCopy(JSON.stringify(ep.responseSample, null, 2), `sample-${ep.id}`)}
                      className="text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
                    >
                      {copiedId === `sample-${ep.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === `sample-${ep.id}` ? 'Copied' : 'Copy Response'}</span>
                    </button>
                  </div>
                  <pre className={`p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-36 ${
                    darkMode ? 'bg-slate-950 text-sky-300 border border-slate-800/80' : 'bg-slate-900 text-sky-200 border border-slate-800'
                  }`}>
                    {JSON.stringify(ep.responseSample, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
