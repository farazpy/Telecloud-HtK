import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Palette,
  Mail,
  Phone,
  MapPin,
  Globe,
  Sliders,
  Radio,
  Users,
  Lock,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Image as ImageIcon,
  KeyRound,
  Database,
  Server,
  Smartphone,
  Laptop,
  Monitor,
  Share2,
  HelpCircle,
  Layers,
  FileText,
  ShieldCheck,
  Building,
  Hash,
  Send,
  Link as LinkIcon,
  HardDrive,
  Trash2,
  Ban,
  Unlock,
  Search,
  Filter,
  CheckSquare,
  Square,
  Copy,
  Check,
  Info,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Film,
  Music,
  Download,
  User,
  List,
  Grid,
  X,
  ShieldAlert
} from 'lucide-react';

interface DevicePreset {
  id: string;
  name: string;
  deviceModel: string;
  systemVersion: string;
  appVersion: string;
  icon: 'laptop' | 'smartphone' | 'monitor' | 'server';
}

const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'telecloud',
    name: 'TeleCloud Cloud Vault (Recommended)',
    deviceModel: 'TeleCloud Vault',
    systemVersion: 'macOS Sonoma 14.5',
    appVersion: 'TeleCloud Vault v1.5.2',
    icon: 'server',
  },
  {
    id: 'macbook',
    name: 'Apple MacBook Pro M3 Max',
    deviceModel: 'MacBook Pro M3 Max',
    systemVersion: 'macOS Sequoia 15.1',
    appVersion: 'Telegram macOS 11.2',
    icon: 'laptop',
  },
  {
    id: 'iphone',
    name: 'Apple iPhone 16 Pro Max',
    deviceModel: 'iPhone 16 Pro Max',
    systemVersion: 'iOS 18.2',
    appVersion: 'Telegram iOS 11.4',
    icon: 'smartphone',
  },
  {
    id: 'windows',
    name: 'Windows 11 Workstation',
    deviceModel: 'Windows 11 Workstation',
    systemVersion: 'Windows 11 Pro 23H2',
    appVersion: 'Telegram Desktop 5.6.1',
    icon: 'monitor',
  },
  {
    id: 'galaxy',
    name: 'Samsung Galaxy S24 Ultra',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    systemVersion: 'Android 15 (One UI 7)',
    appVersion: 'Telegram Android 11.3',
    icon: 'smartphone',
  },
];

interface AdminPanelProps {
  onClose?: () => void;
  onNavigateHome?: () => void;
}

export default function AdminPanel({ onClose, onNavigateHome }: AdminPanelProps) {
  // Authentication State (Default PIN 9890)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('telecloud_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [showPin, setShowPin] = useState<boolean>(false);

  // WordPress Style Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'files' | 'branding' | 'contact' | 'frontend' | 'device' | 'telegram' | 'engine' | 'users' | 'security'
  >('dashboard');

  // Master System & Frontend Configuration (MySQL-Linked)
  const [settings, setSettings] = useState<{
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
  }>({
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
  });

  const [dbStatus, setDbStatus] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [telethonStatus, setTelethonStatus] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  // Selected Preset Tracker
  const [selectedPresetId, setSelectedPresetId] = useState<string>('telecloud');

  // New PIN change state
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // User session action feedback
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);
  const [userActionMsg, setUserActionMsg] = useState<{ id: string; text: string; success: boolean } | null>(null);

  // User-Wise Files Manager State
  const [adminFiles, setAdminFiles] = useState<any[]>([]);
  const [adminFilesLoading, setAdminFilesLoading] = useState<boolean>(false);
  const [adminFilesTotal, setAdminFilesTotal] = useState<number>(0);
  const [adminFilesRestrictedTotal, setAdminFilesRestrictedTotal] = useState<number>(0);
  const [adminFilesSizeBytes, setAdminFilesSizeBytes] = useState<number>(0);
  const [fileUserFilter, setFileUserFilter] = useState<string>('all');
  const [fileStatusFilter, setFileStatusFilter] = useState<'all' | 'active' | 'restricted'>('all');
  const [fileSearchQuery, setFileSearchQuery] = useState<string>('');
  const [fileViewMode, setFileViewMode] = useState<'table' | 'grid'>('table');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());
  const [inspectingFile, setInspectingFile] = useState<any | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<any | null>(null); // null, file object, or 'bulk'
  const [fileActionLoading, setFileActionLoading] = useState<string | null>(null);
  const [copiedFileSlug, setCopiedFileSlug] = useState<string | null>(null);
  const [filePage, setFilePage] = useState<number>(1);
  const [fileNotification, setFileNotification] = useState<{ text: string; success: boolean } | null>(null);

  const fetchAdminFiles = async (page = 1) => {
    setAdminFilesLoading(true);
    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const params = new URLSearchParams();
      if (fileUserFilter && fileUserFilter !== 'all') {
        params.append('telegram_id', fileUserFilter);
      }
      if (fileStatusFilter !== 'all') {
        params.append('status', fileStatusFilter);
      }
      if (fileSearchQuery.trim()) {
        params.append('search', fileSearchQuery.trim());
      }
      params.append('page', String(page));
      params.append('limit', '50');

      const res = await fetch(`/api/admin/files?${params.toString()}`, {
        headers: { 'x-admin-pin': storedPin },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminFiles(data.files || []);
        setAdminFilesTotal(data.total || 0);
        setAdminFilesRestrictedTotal(data.total_restricted || 0);
        setAdminFilesSizeBytes(data.total_size_bytes || 0);
        setFilePage(data.page || 1);
      }
    } catch (err: any) {
      console.error('Failed to fetch admin files:', err);
    } finally {
      setAdminFilesLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'files') {
      fetchAdminFiles(1);
    }
  }, [isAuthenticated, activeTab, fileUserFilter, fileStatusFilter]);

  const handleToggleFileRestriction = async (fileId: number, currentlyRestricted: boolean) => {
    setFileActionLoading(String(fileId));
    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch(`/api/admin/files/${fileId}/restrict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': storedPin,
        },
        body: JSON.stringify({ is_restricted: !currentlyRestricted }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, is_restricted: data.is_restricted } : f))
        );
        if (inspectingFile && inspectingFile.id === fileId) {
          setInspectingFile((prev: any) => ({ ...prev, is_restricted: data.is_restricted }));
        }
        setFileNotification({
          text: data.message || `File ${data.is_restricted ? 'restricted' : 'restored'} successfully.`,
          success: true,
        });
        setAdminFilesRestrictedTotal((prev) => (data.is_restricted ? prev + 1 : Math.max(0, prev - 1)));
      } else {
        setFileNotification({ text: data.error || 'Failed to update restriction state.', success: false });
      }
    } catch (err: any) {
      setFileNotification({ text: err.message || 'Error updating file.', success: false });
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleBulkRestrict = async (isRestricted: boolean) => {
    const ids = Array.from(selectedFileIds);
    if (ids.length === 0) return;
    setFileActionLoading('bulk');
    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch('/api/admin/files/bulk-restrict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': storedPin,
        },
        body: JSON.stringify({ ids, is_restricted: isRestricted }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFileNotification({ text: data.message, success: true });
        setSelectedFileIds(new Set());
        fetchAdminFiles(filePage);
        fetchSettings();
      } else {
        setFileNotification({ text: data.error || 'Bulk action failed.', success: false });
      }
    } catch (err: any) {
      setFileNotification({ text: err.message || 'Error processing bulk action.', success: false });
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    setFileActionLoading(String(fileId));
    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': storedPin },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFileNotification({ text: 'File permanently deleted from catalog.', success: true });
        setDeleteConfirmTarget(null);
        if (inspectingFile && inspectingFile.id === fileId) {
          setInspectingFile(null);
        }
        setSelectedFileIds((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
        fetchAdminFiles(filePage);
        fetchSettings();
      } else {
        setFileNotification({ text: data.error || 'Failed to delete file.', success: false });
      }
    } catch (err: any) {
      setFileNotification({ text: err.message || 'Error deleting file.', success: false });
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedFileIds);
    if (ids.length === 0) return;
    setFileActionLoading('bulk');
    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch('/api/admin/files/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': storedPin,
        },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFileNotification({ text: data.message, success: true });
        setSelectedFileIds(new Set());
        setDeleteConfirmTarget(null);
        fetchAdminFiles(filePage);
        fetchSettings();
      } else {
        setFileNotification({ text: data.error || 'Failed to delete files.', success: false });
      }
    } catch (err: any) {
      setFileNotification({ text: err.message || 'Error deleting files.', success: false });
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleCopySlug = (slug: string) => {
    const link = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedFileSlug(slug);
      setTimeout(() => setCopiedFileSlug(null), 2000);
    });
  };

  const getFileIcon = (fileName: string) => {
    const name = (fileName || '').toLowerCase();
    if (name.endsWith('.pdf')) return <FileText className="w-4 h-4 text-rose-500" />;
    if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz') || name.endsWith('.rar') || name.endsWith('.7z')) {
      return <FileArchive className="w-4 h-4 text-amber-500" />;
    }
    if (name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.avi') || name.endsWith('.mov') || name.endsWith('.webm')) {
      return <Film className="w-4 h-4 text-purple-500" />;
    }
    if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.flac') || name.endsWith('.ogg') || name.endsWith('.m4a')) {
      return <Music className="w-4 h-4 text-emerald-500" />;
    }
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.webp') || name.endsWith('.svg')) {
      return <ImageIcon className="w-4 h-4 text-sky-500" />;
    }
    if (name.endsWith('.json') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py') || name.endsWith('.html') || name.endsWith('.css')) {
      return <FileCode className="w-4 h-4 text-blue-500" />;
    }
    if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  // Fetch admin settings & DB overview
  const fetchSettings = async () => {
    setLoading(true);
    setSaveError('');
    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-pin': storedPin },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
        }));
        setDbStatus(data.dbStatus);
        setOverview(data.overview);
        setTelethonStatus(data.telethonStatus);
        setLocation(data.location);

        // Detect if matching preset
        const matched = DEVICE_PRESETS.find(
          (p) => p.deviceModel === data.settings.device_model && p.systemVersion === data.settings.system_version
        );
        if (matched) setSelectedPresetId(matched.id);
        else setSelectedPresetId('custom');
      } else {
        if (res.status === 401) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('telecloud_admin_auth');
        }
        setSaveError(data.error || 'Failed to load system settings from MySQL.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Network error fetching settings from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  // Handle PIN verification
  const handleVerifyPin = async (e?: React.FormEvent, pinToTest?: string) => {
    if (e) e.preventDefault();
    const pin = pinToTest !== undefined ? pinToTest : pinInput;
    if (!pin) return;

    setIsVerifyingPin(true);
    setPinError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('telecloud_admin_auth', 'true');
        sessionStorage.setItem('telecloud_admin_pin', pin);
        setPinInput('');
      } else {
        setPinError(data.error || 'Invalid Admin PIN. Access denied.');
        setPinInput('');
      }
    } catch (err: any) {
      setPinError('Connection error. Could not verify PIN.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Preset Selection
  const handleSelectPreset = (preset: DevicePreset) => {
    setSelectedPresetId(preset.id);
    setSettings((prev) => ({
      ...prev,
      device_model: preset.deviceModel,
      system_version: preset.systemVersion,
      app_version: preset.appVersion,
    }));
  };

  // Save Settings to MySQL and notify backend
  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': storedPin,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setSettings(data.settings);
        if (data.location) setLocation(data.location);

        // Auto update current document title and favicon if set
        if (data.settings.brand_name) {
          document.title = `${data.settings.brand_name} - Admin Console`;
        }
        if (data.settings.app_favicon_url) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.settings.app_favicon_url;
        }

        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(data.error || 'Failed to save settings to MySQL database.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Network error saving settings to MySQL.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Admin PIN update
  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    if (!newPin || newPin.length < 4) {
      setPinChangeMsg({ text: 'PIN must be at least 4 digits.', error: true });
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg({ text: 'PINs do not match.', error: true });
      return;
    }

    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': storedPin,
        },
        body: JSON.stringify({ admin_pin: newPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('telecloud_admin_pin', newPin);
        setSettings((prev) => ({ ...prev, admin_pin: newPin }));
        setPinChangeMsg({ text: 'Admin PIN successfully updated and saved in MySQL!', error: false });
        setNewPin('');
        setConfirmPin('');
      } else {
        setPinChangeMsg({ text: data.error || 'Failed to update PIN', error: true });
      }
    } catch (err: any) {
      setPinChangeMsg({ text: err.message || 'Error updating PIN', error: true });
    }
  };

  // Handle User Session Verification & 30-Day Renewal
  const handleRenewUserSession = async (telegramId: number | string) => {
    setUserActionLoading(String(telegramId));
    setUserActionMsg(null);
    try {
      const storedPin = sessionStorage.getItem('telecloud_admin_pin') || '9890';
      const res = await fetch('/api/admin/users/reconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': storedPin,
        },
        body: JSON.stringify({ telegram_id: telegramId }),
      });
      const data = await res.json();
      setUserActionMsg({
        id: String(telegramId),
        text: data.message || data.error,
        success: Boolean(data.success),
      });
      if (data.success) {
        fetchSettings();
      }
    } catch (err: any) {
      setUserActionMsg({
        id: String(telegramId),
        text: err.message || 'Error renewing session',
        success: false,
      });
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('telecloud_admin_auth');
    sessionStorage.removeItem('telecloud_admin_pin');
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --------------------------------------------------------------------------
  // LOCKED SCREEN: PIN ENTRY (WordPress style security lock)
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1d2327] border border-slate-700/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden text-slate-100">
          <div className="text-center mb-8 relative">
            <div className="w-14 h-14 mx-auto mb-4 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/10">
              <Lock className="w-7 h-7 text-sky-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">TeleCloud Administration</h1>
            <p className="text-xs text-slate-400 mt-1">Enter Master Admin PIN to unlock WordPress-style console</p>
          </div>

          <form onSubmit={(e) => handleVerifyPin(e)} className="space-y-5">
            <div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  name="telecloud_admin_access_code"
                  id="telecloud_admin_access_code"
                  maxLength={8}
                  placeholder="Enter PIN (Default: 9890)"
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPinInput(val);
                    if (val.length === 4) {
                      handleVerifyPin(undefined, val);
                    }
                  }}
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  autoFocus
                  className="w-full bg-[#101517] border border-slate-700 focus:border-sky-500 rounded-xl py-3 px-4 text-center text-xl font-mono tracking-widest text-white placeholder:text-slate-600 placeholder:text-xs placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            {/* Quick Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 8) {
                      const next = pinInput + String(num);
                      setPinInput(next);
                      if (next.length === 4) {
                        handleVerifyPin(undefined, next);
                      }
                    }
                  }}
                  className="py-2.5 bg-[#262c30] hover:bg-[#32373c] active:bg-sky-500/20 border border-slate-700/60 rounded-lg text-base font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-2.5 bg-[#262c30]/60 hover:bg-[#262c30] text-xs font-medium text-slate-400 border border-slate-700/40 rounded-lg transition-all cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 8) {
                    const next = pinInput + '0';
                    setPinInput(next);
                    if (next.length === 4) {
                      handleVerifyPin(undefined, next);
                    }
                  }
                }}
                className="py-2.5 bg-[#262c30] hover:bg-[#32373c] active:bg-sky-500/20 border border-slate-700/60 rounded-lg text-base font-semibold text-slate-200 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput((p) => p.slice(0, -1))}
                className="py-2.5 bg-[#262c30]/60 hover:bg-[#262c30] text-xs font-medium text-slate-400 border border-slate-700/40 rounded-lg transition-all cursor-pointer"
              >
                Del
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifyingPin || !pinInput}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              {isVerifyingPin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Log In to WordPress Admin</span>
                </>
              )}
            </button>

            {onNavigateHome && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
                >
                  ← Return to {settings.brand_name || 'TeleCloud Vault'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // WORDPRESS-STYLE UNLOCKED ADMIN PANEL
  // --------------------------------------------------------------------------
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Overview' },
    { id: 'files', label: 'Files Manager', icon: HardDrive, badge: 'User-Wise', count: adminFilesTotal || overview?.total_files },
    { id: 'branding', label: 'Identity & Branding', icon: Palette, badge: 'Logo/Favicon' },
    { id: 'contact', label: 'Contact & Company', icon: Mail },
    { id: 'frontend', label: 'Frontend Config', icon: Globe },
    { id: 'device', label: 'Device & Hardware', icon: Laptop },
    { id: 'telegram', label: 'MTProto Core', icon: Radio },
    { id: 'engine', label: 'Chunk & Buffer', icon: Zap },
    { id: 'users', label: 'Users & Sessions', icon: Users, count: overview?.users?.length },
    { id: 'security', label: 'Security & PIN', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#2c3338] dark:bg-slate-950 dark:text-slate-100 flex flex-col -mx-4 -my-8 md:-mx-8">
      {/* 1. WORDPRESS TOP ADMIN BAR */}
      <header className="bg-[#1d2327] text-[#f0f0f1] h-12 flex items-center justify-between px-4 sticky top-0 z-50 shadow-md select-none border-b border-[#2c3338]">
        {/* Left Side: Brand Logo + Visit Site */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-white">
            {settings.app_logo_url ? (
              <img
                src={settings.app_logo_url}
                alt="Logo"
                className="w-5 h-5 rounded-sm object-contain bg-white/10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-5 h-5 rounded-sm bg-sky-500 flex items-center justify-center text-[11px] font-black text-slate-950">
                W
              </div>
            )}
            <span className="hidden sm:inline font-bold tracking-tight">{settings.brand_name || 'TeleCloud'}</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-300 hover:text-sky-400 flex items-center gap-1.5 transition-colors"
              title="Return to public website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Visit Site</span>
            </button>
          )}

          {/* MySQL & MTProto live connection indicator */}
          <div className="hidden lg:flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MySQL: {dbStatus?.database || 'telecloud'} ({dbStatus?.host || '127.0.0.1'})
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              MTProto: {telethonStatus?.connected ? 'Online' : 'Restoring'}
            </span>
          </div>
        </div>

        {/* Right Side: Save changes + Howdy Admin + Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-50 text-white font-medium text-xs rounded shadow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <button
            onClick={fetchSettings}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Reload settings from MySQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="h-4 w-[1px] bg-slate-700" />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Howdy,</span>
            <span className="font-semibold text-white">Administrator</span>
            <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-[10px]">
              A
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors ml-1"
            title="Log out from WordPress admin"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT: WORDPRESS LEFT SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-3rem)]">
        {/* WORDPRESS LEFT SIDEBAR */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } bg-[#1d2327] text-[#c3c4c7] flex-shrink-0 transition-all duration-200 border-r border-[#2c3338] flex flex-col justify-between select-none`}
        >
          {/* Menu Items */}
          <div className="py-2">
            <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {!sidebarCollapsed && 'WordPress Admin'}
            </div>

            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center px-4 py-3 text-xs font-medium transition-colors relative cursor-pointer group ${
                      isActive
                        ? 'bg-[#2271b1] text-white font-semibold'
                        : 'text-[#c3c4c7] hover:bg-[#131719] hover:text-white'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {!sidebarCollapsed && (
                      <span className="ml-3 flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.count !== undefined && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">
                        {item.count}
                      </span>
                    )}
                    {!sidebarCollapsed && item.badge && !item.count && (
                      <span className="ml-2 px-1.5 py-0.2 text-[9px] rounded bg-sky-500/20 text-sky-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Collapse/Expand Footer Toggle */}
          <div className="p-3 border-t border-[#2c3338]">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded text-xs text-slate-400 hover:text-white hover:bg-[#2c3338] transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[11px]">Collapse menu</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* MAIN WORDPRESS CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          {/* Notifications / Alerts */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 rounded-r-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm shadow-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Settings saved.</strong> Your frontend branding, logo, favicon, and system parameters are active in MySQL.
                </span>
              </div>
              <button onClick={() => setSaveSuccess(false)} className="text-xs underline hover:text-emerald-900">
                Dismiss
              </button>
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 rounded-r-xl flex items-center gap-2.5 text-rose-800 dark:text-rose-300 text-sm shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 dark:border-slate-800 pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    System health, active database connections, and MTProto cloud metrics.
                  </p>
                </div>
                <div className="text-xs font-mono px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
                  Cluster: <strong>{settings.custom_domain || 's3.htknetwork.in'}</strong>
                </div>
              </div>

              {/* Top Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Users</span>
                    <Users className="w-5 h-5 text-sky-500" />
                  </div>
                  <div className="text-2xl font-extrabold mt-2">{overview?.total_users || 0}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Registered Telegram accounts</div>
                </div>

                <div
                  onClick={() => setActiveTab('files')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-xl p-5 shadow-xs cursor-pointer transition-all hover:scale-[1.01]"
                  title="Click to manage all user files"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Files</span>
                    <HardDrive className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-extrabold mt-2">{overview?.total_files || 0}</div>
                  <div className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 flex items-center justify-between">
                    <span>Stored in MTProto catalog</span>
                    <span className="font-semibold underline">Manage Files →</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Storage Used</span>
                    <Server className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-extrabold mt-2">{formatBytes(overview?.total_size_bytes || 0)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Free Unlimited Telegram Cloud</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">MySQL Engine</span>
                    <Database className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-base font-bold mt-2 text-emerald-600 dark:text-emerald-400">
                    {dbStatus?.connected ? 'Operational' : 'Disconnected'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{dbStatus?.user}@{dbStatus?.host}:{dbStatus?.port}</div>
                </div>
              </div>

              {/* System Summary & Live Status Box */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-500" />
                    <span>Active Frontend & Brand Configuration</span>
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Site Title:</span>
                      <span className="font-semibold">{settings.brand_name || 'TeleCloud Vault'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Tagline:</span>
                      <span className="font-semibold text-right max-w-xs truncate">{settings.app_tagline}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">App Logo:</span>
                      <span className="font-mono text-sky-600 dark:text-sky-400">
                        {settings.app_logo_url ? 'Configured (Image URL)' : 'Default Vector Cloud Logo'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Favicon:</span>
                      <span className="font-mono text-sky-600 dark:text-sky-400">
                        {settings.app_favicon_url ? 'Configured' : 'Default Icon'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Support Email:</span>
                      <span className="font-semibold">{settings.contact_email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('branding')}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Customize Branding & Appearance →
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500" />
                    <span>MTProto Server & Network Routing</span>
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Device Identity:</span>
                      <span className="font-semibold">{settings.device_model}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">System OS Emulation:</span>
                      <span className="font-semibold">{settings.system_version}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Stream Buffer Chunk Size:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {settings.upload_chunk_size_kb || '512'} KB (High Speed)
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Egress Location:</span>
                      <span className="font-semibold">
                        {location?.city ? `${location.city}, ${location.country}` : 'Direct Datacenter MTProto'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Auto-Restore Session:</span>
                      <span className="font-semibold text-emerald-600">Active in MySQL</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('engine')}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Manage Performance & Engine →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: COMPREHENSIVE USER-WISE FILES MANAGER */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Notification Banner */}
              {fileNotification && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs border ${
                    fileNotification.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {fileNotification.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span className="font-medium">{fileNotification.text}</span>
                  </div>
                  <button onClick={() => setFileNotification(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                    <HardDrive className="w-6 h-6 text-sky-500" />
                    <span>Files Manager (User-Wise & System-Wide)</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage, inspect, restrict access (block API & direct downloads), and permanently delete files across all registered users.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchAdminFiles(filePage)}
                    disabled={adminFilesLoading}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${adminFilesLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Metric Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Stored Files</span>
                    <FileText className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-2xl font-extrabold mt-1 font-mono tabular-nums">{adminFilesTotal}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across all registered user accounts</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Restricted Files</span>
                    <Ban className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-extrabold mt-1 font-mono tabular-nums text-rose-600 dark:text-rose-400">{adminFilesRestrictedTotal}</div>
                  <div className="text-[11px] text-rose-500/80 mt-0.5 font-medium">Blocked from API & CDN Streaming</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Public Files</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-extrabold mt-1 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {Math.max(0, adminFilesTotal - adminFilesRestrictedTotal)}
                  </div>
                  <div className="text-[11px] text-emerald-500/80 mt-0.5 font-medium">Public high-speed CDN delivery</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Storage Consumed</span>
                    <Server className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-extrabold mt-1 font-mono tabular-nums">{formatBytes(adminFilesSizeBytes)}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Telegram MTProto storage volume</div>
                </div>
              </div>

              {/* Filter, Search & View Controls */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* User-Wise Selector & Status Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* User Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">User:</span>
                      <select
                        value={fileUserFilter}
                        onChange={(e) => {
                          setFileUserFilter(e.target.value);
                          setFilePage(1);
                        }}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value="all">All Users ({overview?.total_users || 0})</option>
                        {(overview?.users || []).map((u: any) => (
                          <option key={u.telegram_id} value={u.telegram_id}>
                            {u.name} {u.username ? `(${u.username})` : ''} · ID: {u.telegram_id} ({u.file_count} files)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick clear user filter chip if active */}
                    {fileUserFilter !== 'all' && (
                      <button
                        onClick={() => {
                          setFileUserFilter('all');
                          setFilePage(1);
                        }}
                        className="px-2 py-1 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-200 rounded-md text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <span>Filtered User: #{fileUserFilter}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {/* Status Filter Segmented Controls */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <button
                        onClick={() => {
                          setFileStatusFilter('all');
                          setFilePage(1);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          fileStatusFilter === 'all'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        All ({adminFilesTotal})
                      </button>
                      <button
                        onClick={() => {
                          setFileStatusFilter('active');
                          setFilePage(1);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          fileStatusFilter === 'active'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Active ({Math.max(0, adminFilesTotal - adminFilesRestrictedTotal)})
                      </button>
                      <button
                        onClick={() => {
                          setFileStatusFilter('restricted');
                          setFilePage(1);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          fileStatusFilter === 'restricted'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Restricted ({adminFilesRestrictedTotal})
                      </button>
                    </div>
                  </div>

                  {/* Search Box & View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        fetchAdminFiles(1);
                      }}
                      className="relative min-w-[220px]"
                    >
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={fileSearchQuery}
                        onChange={(e) => setFileSearchQuery(e.target.value)}
                        placeholder="Search file, slug, owner..."
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                      />
                      {fileSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setFileSearchQuery('');
                            setTimeout(() => fetchAdminFiles(1), 50);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </form>

                    <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <button
                        onClick={() => setFileViewMode('table')}
                        className={`p-1.5 rounded-md transition ${
                          fileViewMode === 'table'
                            ? 'bg-white dark:bg-slate-800 text-sky-500 shadow-xs'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Table View"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setFileViewMode('grid')}
                        className={`p-1.5 rounded-md transition ${
                          fileViewMode === 'grid'
                            ? 'bg-white dark:bg-slate-800 text-sky-500 shadow-xs'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Grid View"
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedFileIds.size > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-sky-50/50 dark:bg-sky-950/20 -mx-4 -mb-4 p-3 rounded-b-xl border-t">
                    <div className="flex items-center gap-2 text-xs font-semibold text-sky-900 dark:text-sky-200">
                      <CheckSquare className="w-4 h-4 text-sky-500" />
                      <span>{selectedFileIds.size} file(s) selected</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBulkRestrict(true)}
                        disabled={fileActionLoading === 'bulk'}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Restrict Access</span>
                      </button>

                      <button
                        onClick={() => handleBulkRestrict(false)}
                        disabled={fileActionLoading === 'bulk'}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Restore Access</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmTarget('bulk')}
                        disabled={fileActionLoading === 'bulk'}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Permanently</span>
                      </button>

                      <button
                        onClick={() => setSelectedFileIds(new Set())}
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TABLE VIEW */}
              {fileViewMode === 'table' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 select-none">
                        <tr>
                          <th className="px-3 py-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={adminFiles.length > 0 && selectedFileIds.size === adminFiles.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFileIds(new Set(adminFiles.map((f) => f.id)));
                                } else {
                                  setSelectedFileIds(new Set());
                                }
                              }}
                              className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3">File Name & Link</th>
                          <th className="px-4 py-3">Owner (User)</th>
                          <th className="px-3 py-3">Workspace</th>
                          <th className="px-3 py-3 font-mono text-right">Size</th>
                          <th className="px-3 py-3 font-mono text-right">Uploaded</th>
                          <th className="px-3 py-3 text-center">Access Policy</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {adminFilesLoading && adminFiles.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
                              <span>Loading catalog files from MySQL database...</span>
                            </td>
                          </tr>
                        )}

                        {!adminFilesLoading && adminFiles.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                              <HardDrive className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                              <div className="font-semibold text-slate-700 dark:text-slate-300">No files found</div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {fileUserFilter !== 'all' || fileStatusFilter !== 'all' || fileSearchQuery
                                  ? 'Try adjusting your filters or search keywords.'
                                  : 'No files have been uploaded yet.'}
                              </div>
                            </td>
                          </tr>
                        )}

                        {adminFiles.map((f) => {
                          const isSelected = selectedFileIds.has(f.id);
                          const isRestricted = Boolean(f.is_restricted);
                          return (
                            <tr
                              key={f.id}
                              className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                                isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                              }`}
                            >
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const next = new Set(selectedFileIds);
                                    if (e.target.checked) next.add(f.id);
                                    else next.delete(f.id);
                                    setSelectedFileIds(next);
                                  }}
                                  className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 max-w-[260px]">
                                <div className="flex items-center gap-2">
                                  <div className="shrink-0">{getFileIcon(f.file_name)}</div>
                                  <div className="truncate">
                                    <div className="font-bold text-slate-900 dark:text-white truncate" title={f.file_name}>
                                      {f.file_name}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                                      <span className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer" onClick={() => handleCopySlug(f.file_slug)}>
                                        /f/{f.file_slug}
                                      </span>
                                      <button
                                        onClick={() => handleCopySlug(f.file_slug)}
                                        className="text-slate-400 hover:text-sky-500"
                                        title="Copy Link"
                                      >
                                        {copiedFileSlug === f.file_slug ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div
                                  onClick={() => {
                                    setFileUserFilter(String(f.telegram_id));
                                    setFilePage(1);
                                  }}
                                  className="cursor-pointer group"
                                  title="Filter to this user"
                                >
                                  <div className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-500 transition truncate max-w-[150px]">
                                    {f.user_name || 'User'}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {f.user_username || `ID: ${f.telegram_id}`}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                                <span className="font-mono text-[11px]">{f.workspace_name || 'Default'}</span>
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                                {formatBytes(f.file_size)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-400 text-[11px]">
                                {new Date(f.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {isRestricted ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                      RESTRICTED
                                    </span>
                                    <span className="text-[9px] text-rose-400 mt-0.5">Blocked via API/CDN</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      ACTIVE
                                    </span>
                                    <span className="text-[9px] text-slate-400 mt-0.5">Public Stream</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Restrict / Unrestrict Toggle */}
                                  <button
                                    onClick={() => handleToggleFileRestriction(f.id, isRestricted)}
                                    disabled={fileActionLoading === String(f.id)}
                                    className={`p-1.5 rounded-md transition cursor-pointer ${
                                      isRestricted
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                    }`}
                                    title={isRestricted ? 'Restore Access (Allow API & CDN)' : 'Restrict Access (Block API & CDN)'}
                                  >
                                    {isRestricted ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Inspect Metadata */}
                                  <button
                                    onClick={() => setInspectingFile(f)}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                    title="Inspect File Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Copy Link */}
                                  <button
                                    onClick={() => handleCopySlug(f.file_slug)}
                                    className="p-1.5 text-sky-600 hover:text-sky-800 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-md transition cursor-pointer"
                                    title="Copy CDN Link"
                                  >
                                    {copiedFileSlug === f.file_slug ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <LinkIcon className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Delete File */}
                                  <button
                                    onClick={() => setDeleteConfirmTarget(f)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer"
                                    title="Delete Permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {adminFilesTotal > 50 && (
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Showing {(filePage - 1) * 50 + 1} - {Math.min(filePage * 50, adminFilesTotal)} of {adminFilesTotal} files
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => fetchAdminFiles(filePage - 1)}
                          disabled={filePage <= 1 || adminFilesLoading}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-semibold disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <span className="font-mono px-2">Page {filePage}</span>
                        <button
                          onClick={() => fetchAdminFiles(filePage + 1)}
                          disabled={filePage * 50 >= adminFilesTotal || adminFilesLoading}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-semibold disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GRID VIEW */}
              {fileViewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {adminFiles.map((f) => {
                    const isRestricted = Boolean(f.is_restricted);
                    const isSelected = selectedFileIds.has(f.id);
                    return (
                      <div
                        key={f.id}
                        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs flex flex-col justify-between transition relative ${
                          isRestricted
                            ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                            : isSelected
                            ? 'border-sky-500 bg-sky-50/20'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                              {getFileIcon(f.file_name)}
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const next = new Set(selectedFileIds);
                                  if (e.target.checked) next.add(f.id);
                                  else next.delete(f.id);
                                  setSelectedFileIds(next);
                                }}
                                className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={f.file_name}>
                              {f.file_name}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-1">
                              <span>{formatBytes(f.file_size)}</span>
                              <span>{new Date(f.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Owner:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                {f.user_name || 'User'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Shortlink:</span>
                              <span className="font-mono text-sky-600 dark:text-sky-400 truncate">
                                /f/{f.file_slug}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Access:</span>
                              {isRestricted ? (
                                <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Restricted
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active CDN
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleToggleFileRestriction(f.id, isRestricted)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                              isRestricted
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                            }`}
                          >
                            {isRestricted ? <Unlock className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            <span>{isRestricted ? 'Restore' : 'Restrict'}</span>
                          </button>

                          <button
                            onClick={() => setInspectingFile(f)}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Inspect Metadata"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleCopySlug(f.file_slug)}
                            className="p-1.5 text-sky-500 hover:text-white hover:bg-sky-600 rounded-lg transition"
                            title="Copy Shortlink"
                          >
                            {copiedFileSlug === f.file_slug ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmTarget(f)}
                            className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: SITE IDENTITY, LOGO & FAVICON */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Appearance & Branding</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure your application logo, favicon, site title, badge, and frontend visual identity.
                </p>
              </div>

              {/* Live Preview Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Live Header Preview</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Updates dynamically</span>
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-3">
                    {settings.app_logo_url ? (
                      <img
                        src={settings.app_logo_url}
                        alt="Logo Preview"
                        className="h-8 max-w-[120px] object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold">
                        <Server className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                        <span>{settings.brand_name || 'TeleCloud Vault'}</span>
                        {settings.app_badge_text && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {settings.app_badge_text}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {settings.app_tagline || 'Decentralized MTProto Cloud Storage'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold">
                    Connected
                  </div>
                </div>
              </div>

              {/* Form Settings */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Site Title / Brand Name
                    </label>
                    <input
                      type="text"
                      value={settings.brand_name}
                      onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                      placeholder="e.g. TeleCloud Vault"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Shown in the header, title tag, and marketing pages.</p>
                  </div>

                  {/* App Badge Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Header Badge Text
                    </label>
                    <input
                      type="text"
                      value={settings.app_badge_text}
                      onChange={(e) => setSettings({ ...settings, app_badge_text: e.target.value })}
                      placeholder="e.g. MTProto 2.0 Cloud"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Small pill badge beside the logo.</p>
                  </div>

                  {/* Tagline */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      value={settings.app_tagline}
                      onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
                      placeholder="e.g. Decentralized MTProto Cloud Storage & High-Speed Direct CDN"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* App Logo URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                      <span>App Logo URL</span>
                      {settings.app_logo_url && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, app_logo_url: '' })}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={settings.app_logo_url}
                        onChange={(e) => setSettings({ ...settings, app_logo_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500 font-mono text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Direct link to PNG, SVG, or WebP logo image.</p>
                  </div>

                  {/* Favicon URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                      <span>Favicon URL (.ico / .png)</span>
                      {settings.app_favicon_url && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, app_favicon_url: '' })}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={settings.app_favicon_url}
                        onChange={(e) => setSettings({ ...settings, app_favicon_url: e.target.value })}
                        placeholder="https://example.com/favicon.ico"
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500 font-mono text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Browser tab icon URL.</p>
                  </div>

                  {/* Primary Theme Accent Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primary_color || '#0284c7'}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={settings.primary_color || '#0284c7'}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Copyright Notice */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Footer Copyright Text
                    </label>
                    <input
                      type="text"
                      value={settings.copyright_text}
                      onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                      placeholder="e.g. © 2026 TeleCloud MTProto Engine."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                    <span>{saving ? 'Saving to MySQL...' : 'Save Branding'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: CONTACT INFORMATION */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Contact & Support Details</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage official support contacts, emails, telephone numbers, and social channels shown across the website.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-500" />
                      <span>Official Support Email</span>
                    </label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      placeholder="support@htknetwork.in"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Telephone / WhatsApp</span>
                    </label>
                    <input
                      type="text"
                      value={settings.contact_phone}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      placeholder="+91 74985 84149"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Headquarters / Datacenter Address</span>
                    </label>
                    <input
                      type="text"
                      value={settings.contact_address}
                      onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                      placeholder="Global Technology Park, Server Hub #402"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Telegram Link */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>Telegram Support Channel / Bot</span>
                    </label>
                    <input
                      type="url"
                      value={settings.support_telegram_url}
                      onChange={(e) => setSettings({ ...settings, support_telegram_url: e.target.value })}
                      placeholder="https://t.me/TeleCloudSupport"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Discord URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Discord Community Server</span>
                    </label>
                    <input
                      type="url"
                      value={settings.support_discord_url}
                      onChange={(e) => setSettings({ ...settings, support_discord_url: e.target.value })}
                      placeholder="https://discord.gg/yourserver"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* GitHub URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>GitHub Organization / Repository</span>
                    </label>
                    <input
                      type="url"
                      value={settings.github_url}
                      onChange={(e) => setSettings({ ...settings, github_url: e.target.value })}
                      placeholder="https://github.com/your-org"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Twitter / X */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Twitter / X Profile</span>
                    </label>
                    <input
                      type="url"
                      value={settings.twitter_url}
                      onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                      placeholder="https://x.com/your-brand"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                    <span>{saving ? 'Saving to MySQL...' : 'Save Contact Details'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: FRONTEND FEATURES & PUBLIC CONFIGURATION */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'frontend' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Frontend Configuration</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Control which public pages, forms, and modules are enabled for visitors.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
                <div className="space-y-4">
                  {/* Custom Domain */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Production Subdomain / Custom Domain
                    </label>
                    <input
                      type="text"
                      value={settings.custom_domain}
                      onChange={(e) => setSettings({ ...settings, custom_domain: e.target.value })}
                      placeholder="s3.htknetwork.in"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm font-mono focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Used to generate public file shortlinks (`/f/{'{file_id}'}`).</p>
                  </div>

                  {/* Public Pricing Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Enable Public Pricing Page</div>
                      <div className="text-xs text-slate-500">Show the enterprise plan table on `/pricing`.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          enable_public_pricing: settings.enable_public_pricing === 'true' ? 'false' : 'true',
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.enable_public_pricing === 'true' ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          settings.enable_public_pricing === 'true' ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Contact Form Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Enable Support & Inquiries Form</div>
                      <div className="text-xs text-slate-500">Allow users to open support tickets via `/contact`.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          enable_contact_form: settings.enable_contact_form === 'true' ? 'false' : 'true',
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.enable_contact_form === 'true' ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          settings.enable_contact_form === 'true' ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* API Console Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Enable Developer API Console</div>
                      <div className="text-xs text-slate-500">Provide developers interactive cURL endpoints in the dashboard.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          enable_api_console: settings.enable_api_console === 'true' ? 'false' : 'true',
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.enable_api_console === 'true' ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          settings.enable_api_console === 'true' ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                    <span>{saving ? 'Saving to MySQL...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 5: DEVICE & MTPROTO HARDWARE IDENTITY */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'device' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Device & Hardware Identity</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Control how your MTProto sessions appear inside Telegram Settings → Active Sessions.
                </p>
              </div>

              {/* Hardware Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEVICE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500 text-sky-900 dark:text-sky-300 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs">{preset.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                        <div>Model: {preset.deviceModel}</div>
                        <div>OS: {preset.systemVersion}</div>
                        <div>App: {preset.appVersion}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Device Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Device Model
                    </label>
                    <input
                      type="text"
                      value={settings.device_model}
                      onChange={(e) => {
                        setSelectedPresetId('custom');
                        setSettings({ ...settings, device_model: e.target.value });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      System Version
                    </label>
                    <input
                      type="text"
                      value={settings.system_version}
                      onChange={(e) => {
                        setSelectedPresetId('custom');
                        setSettings({ ...settings, system_version: e.target.value });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      App Version String
                    </label>
                    <input
                      type="text"
                      value={settings.app_version}
                      onChange={(e) => {
                        setSelectedPresetId('custom');
                        setSettings({ ...settings, app_version: e.target.value });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    MTProto Proxy URL (Optional SOCKS5 / HTTP)
                  </label>
                  <input
                    type="text"
                    value={settings.proxy_url}
                    onChange={(e) => setSettings({ ...settings, proxy_url: e.target.value })}
                    placeholder="socks5://user:pass@proxy-host:1080"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm font-mono"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Apply Hardware Identity'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 6: TELEGRAM MTPROTO CORE */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'telegram' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Telegram MTProto Core Settings</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Default Telegram application credentials stored centrally in MySQL.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Telegram API ID
                    </label>
                    <input
                      type="text"
                      value={settings.telegram_api_id}
                      onChange={(e) => setSettings({ ...settings, telegram_api_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Telegram API Hash
                    </label>
                    <input
                      type="text"
                      value={settings.telegram_api_hash}
                      onChange={(e) => setSettings({ ...settings, telegram_api_hash: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Default Storage Destination Chat
                    </label>
                    <input
                      type="text"
                      value={settings.storage_chat}
                      onChange={(e) => setSettings({ ...settings, storage_chat: e.target.value })}
                      placeholder="me or Channel ID like -100xxxxxxxxxx"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Use <code className="font-mono text-sky-600">me</code> for Saved Messages, or a Channel ID where bot/user is Admin.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Core Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 7: PERFORMANCE & CHUNK ENGINE */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'engine' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Performance & High-Concurrency Buffers</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Optimize streaming throughput, MTProto request chunk size, and concurrent pipe limits.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Stream Download Chunk Size (KB)
                    </label>
                    <select
                      value={settings.upload_chunk_size_kb || '512'}
                      onChange={(e) => setSettings({ ...settings, upload_chunk_size_kb: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm"
                    >
                      <option value="128">128 KB (Standard Sequential)</option>
                      <option value="256">256 KB (Medium Concurrency)</option>
                      <option value="512">512 KB (Gold Standard / Fastest)</option>
                      <option value="1024">1024 KB (Large Video Seek)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">512 KB reduces MTProto roundtrip packets to Telegram servers.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Max Parallel Upload Workers
                    </label>
                    <select
                      value={settings.max_parallel_uploads || '4'}
                      onChange={(e) => setSettings({ ...settings, max_parallel_uploads: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm"
                    >
                      <option value="2">2 Concurrent Connections</option>
                      <option value="4">4 Concurrent Connections (Recommended)</option>
                      <option value="8">8 High-Throughput Connections</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Update Engine Parameters'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 8: USERS & 30-DAY SESSIONS */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 dark:border-slate-800 pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Registered Users & 30-Day Sessions</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage accounts, session strings, and storage distribution across Telegram users.
                  </p>
                </div>
                <button
                  onClick={fetchSettings}
                  className="text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Users</span>
                </button>
              </div>

              {userActionMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    userActionMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}
                >
                  {userActionMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{userActionMsg.text}</span>
                </div>
              )}

              {/* Users Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Telegram User</th>
                        <th className="px-4 py-3">Storage Chat</th>
                        <th className="px-4 py-3">Files</th>
                        <th className="px-4 py-3">Storage</th>
                        <th className="px-4 py-3">Session Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {(overview?.users || []).map((u: any) => (
                        <tr key={u.telegram_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {u.telegram_id} {u.username}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">{u.storage_chat}</td>
                          <td className="px-4 py-3">{u.file_count} files</td>
                          <td className="px-4 py-3 font-mono">{formatBytes(u.storage_used)}</td>
                          <td className="px-4 py-3">
                            {u.is_expired ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-500 font-semibold">
                                Expired / Lost
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                Active 30-Day
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setFileUserFilter(String(u.telegram_id));
                                  setActiveTab('files');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                title="View and manage user files in Files Manager"
                              >
                                <HardDrive className="w-3 h-3 text-sky-500" />
                                <span>Files ({u.file_count})</span>
                              </button>
                              <button
                                onClick={() => handleRenewUserSession(u.telegram_id)}
                                disabled={userActionLoading === String(u.telegram_id)}
                                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                {userActionLoading === String(u.telegram_id) ? 'Testing...' : 'Test / Renew'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!overview?.users || overview.users.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            No users registered in MySQL database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 9: SECURITY & PIN MANAGEMENT */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Security & Master Admin PIN</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Change the Master PIN used to unlock this administration panel.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs max-w-lg space-y-5">
                {pinChangeMsg && (
                  <div
                    className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
                      pinChangeMsg.error
                        ? 'bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    {pinChangeMsg.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{pinChangeMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      New Admin PIN (Min 4 Digits)
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter new PIN"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm font-mono tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Confirm New Admin PIN
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter new PIN"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm font-mono tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg shadow transition-colors cursor-pointer"
                  >
                    Save New Master PIN to MySQL
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* INSPECT FILE METADATA MODAL */}
          {/* ------------------------------------------------------------- */}
          {inspectingFile && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getFileIcon(inspectingFile.file_name)}
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-slate-900 dark:text-white truncate max-w-sm" title={inspectingFile.file_name}>
                        {inspectingFile.file_name}
                      </h2>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Record ID #{inspectingFile.id} · Message #{inspectingFile.message_id}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectingFile(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Metadata Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unique Shortlink</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sky-600 dark:text-sky-400 truncate">
                        /f/{inspectingFile.file_slug}
                      </span>
                      <button
                        onClick={() => handleCopySlug(inspectingFile.file_slug)}
                        className="text-slate-400 hover:text-sky-500"
                        title="Copy Link"
                      >
                        {copiedFileSlug === inspectingFile.file_slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">File Size & MIME</span>
                    <div className="font-mono font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {formatBytes(inspectingFile.file_size)} · {inspectingFile.mime_type || 'octet-stream'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Owner</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {inspectingFile.user_name || 'User'} ({inspectingFile.user_username || `ID: ${inspectingFile.telegram_id}`})
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Workspace & Storage</span>
                    <div className="font-mono text-slate-700 dark:text-slate-200 truncate">
                      {inspectingFile.workspace_name || 'Default'} · {inspectingFile.storage_chat || 'me'}
                    </div>
                  </div>
                </div>

                {/* Access Restriction Policy Controller */}
                <div
                  className={`p-4 rounded-xl border transition ${
                    inspectingFile.is_restricted
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Access Control State:
                        </span>
                        {inspectingFile.is_restricted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                            RESTRICTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {inspectingFile.is_restricted
                          ? 'This file is restricted: cannot be served through API endpoints or downloaded in browser (HTTP 403).'
                          : 'This file is active: public CDN streaming and API endpoints serve it normally.'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleFileRestriction(inspectingFile.id, inspectingFile.is_restricted)}
                      disabled={fileActionLoading === String(inspectingFile.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0 ${
                        inspectingFile.is_restricted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      {inspectingFile.is_restricted ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      <span>{inspectingFile.is_restricted ? 'Restore Public Access' : 'Restrict File Access'}</span>
                    </button>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setDeleteConfirmTarget(inspectingFile);
                    }}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete File Permanently</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySlug(inspectingFile.file_slug)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedFileSlug === inspectingFile.file_slug ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Shortlink</span>
                    </button>

                    <button
                      onClick={() => setInspectingFile(null)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* DELETE CONFIRMATION DIALOG */}
          {/* ------------------------------------------------------------- */}
          {deleteConfirmTarget && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {deleteConfirmTarget === 'bulk'
                      ? `Delete ${selectedFileIds.size} Selected Files?`
                      : 'Permanently Delete File?'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {deleteConfirmTarget === 'bulk'
                      ? `Are you sure you want to permanently delete ${selectedFileIds.size} selected file(s)? This will remove them from the MySQL catalog, clear the CDN disk cache, and reclaim storage.`
                      : `Are you sure you want to delete "${deleteConfirmTarget.file_name}"? This action cannot be undone.`}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => setDeleteConfirmTarget(null)}
                    disabled={fileActionLoading === 'bulk'}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      if (deleteConfirmTarget === 'bulk') {
                        handleBulkDelete();
                      } else {
                        handleDeleteFile(deleteConfirmTarget.id);
                      }
                    }}
                    disabled={fileActionLoading !== null}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{fileActionLoading !== null ? 'Deleting...' : 'Yes, Delete Permanently'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
