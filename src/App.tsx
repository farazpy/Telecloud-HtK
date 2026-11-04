import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import AdminPanel from './components/AdminPanel';
import {
  UploadCloud,
  File,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Archive,
  Download,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Settings,
  Radio,
  HardDrive,
  Send,
  Key,
  FileKey,
  Lock,
  AlertCircle,
  Eye,
  Smartphone,
  Laptop,
  Monitor,
  MapPin,
  Cpu,
  Bot,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Database,
  Edit2,
  ArrowRight,
  Zap,
  Globe,
  Sparkles,
  LogOut,
  UserCheck,
  BarChart3,
  Search,
  LayoutGrid,
  List,
  Play,
  Film,
  Link as LinkIcon,
  Server,
  Share2,
  QrCode,
  Sliders,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink as LinkExternal,
  Plus,
  RotateCcw,
  FileCheck,
  Activity,
  Flame,
  FileQuestion,
  Clock,
  AlertTriangle,
  Unlock,
  EyeOff,
  Shield,
} from 'lucide-react';
import { ApiConsolePage } from './components/ApiConsolePage';
import FeaturesPage from './pages/FeaturesPage';
import BenefitsPage from './pages/BenefitsPage';
import StreamingPage from './pages/StreamingPage';
import SecurityPage from './pages/SecurityPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_bot?: boolean;
  phone?: string;
}

interface StorageFile {
  id?: number;
  telegram_id?: number | string;
  message_id: number;
  file_slug?: string;
  workspace_id?: number | null;
  workspace_name?: string | null;
  file_name: string;
  original_name?: string;
  file_size: number;
  mime_type: string;
  caption?: string;
  storage_chat?: string;
  date?: string;
  created_at?: string;
  direct_link?: string;
  telegram_link?: string;
}

export interface BulkUploadItem {
  id: string;
  file: globalThis.File;
  name: string;
  size: number;
  type: string;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  progress: number;
  result?: StorageFile | null;
  error?: string | null;
}

export interface Workspace {
  id: number;
  telegram_id: string;
  name: string;
  slug: string;
  storage_chat: string;
  is_default: boolean;
  file_count?: number;
  total_bytes?: number;
  created_at?: string;
  updated_at?: string;
}

interface StatsData {
  totalFiles: number;
  totalBytes: number;
  breakdown: Record<string, { count: number; bytes: number }>;
  recentFiles: StorageFile[];
}

export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digits: number | number[];
  example: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', digits: 10, example: '74985 84149' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', digits: 10, example: '202 555 0143' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', digits: [10, 11], example: '7911 123456' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', digits: 9, example: '50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', digits: 9, example: '51 234 5678' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', digits: 10, example: '416 555 0183' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', digits: 9, example: '412 345 678' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', digits: [10, 11], example: '151 1234567' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', digits: 9, example: '6 12 34 56 78' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', digits: 10, example: '300 1234567' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', digits: 10, example: '171 2345678' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', digits: 10, example: '912 345 6789' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', digits: [10, 11], example: '11 98765 4321' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', digits: [9, 10, 11, 12], example: '812 3456 7890' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', digits: 10, example: '917 123 4567' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', digits: 10, example: '802 123 4567' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', digits: 8, example: '8123 4567' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', digits: [9, 10], example: '12 345 6789' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', digits: 9, example: '71 123 4567' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', digits: 10, example: '532 123 4567' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', digits: 10, example: '320 123 4567' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', digits: 9, example: '612 34 56 78' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', digits: 9, example: '6 12345678' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', digits: [9, 10], example: '91 234 5678' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', digits: 10, example: '55 1234 5678' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', digits: 10, example: '984 1234567' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', digits: 9, example: '71 234 5678' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', digits: 10, example: '90 1234 5678' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', digits: 10, example: '10 1234 5678' },
  { code: 'OTHER', name: 'Other International', dialCode: '+', flag: '🌐', digits: [7, 8, 9, 10, 11, 12, 13, 14, 15], example: '123456789' },
];

export interface StorageChatOption {
  id: string;
  title: string;
  type?: string;
  is_self?: boolean;
  badge?: string;
  description?: string;
}

interface GridImagePreviewProps {
  file: StorageFile;
  darkMode: boolean;
  getFileIcon: (mime?: string, name?: string) => React.ReactNode;
}

const GridImagePreview: React.FC<GridImagePreviewProps> = ({ file, darkMode, getFileIcon }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isImg = file.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.file_name);
  const imageSrc = `/f/${file.file_slug || file.message_id}/${encodeURIComponent(file.file_name)}`;

  if (!isImg) {
    return (
      <div className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center space-y-1.5 border shrink-0 ${
        darkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-150'
      }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          darkMode ? 'bg-slate-900 border border-slate-800 text-sky-400' : 'bg-slate-100 border border-slate-200'
        }`}>
          {getFileIcon(file.mime_type, file.file_name)}
        </div>
        <span className="text-[10px] text-slate-500 font-mono tracking-wider font-extrabold uppercase">
          {file.mime_type ? file.mime_type.split('/')[1]?.slice(0, 8) : 'BINARY'}
        </span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center space-y-1.5 border shrink-0 ${
        darkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-150'
      }`}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span className="text-[10px] text-rose-500 font-bold">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={`aspect-square w-full rounded-2xl overflow-hidden border relative flex items-center justify-center group shrink-0 ${
      darkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-150'
    }`}>
      {/* Creative Loader */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="relative flex items-center justify-center w-14 h-14">
            <div className="absolute inset-0 rounded-full bg-sky-500/10 animate-ping duration-1000" />
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-sky-500/40 animate-spin" style={{ animationDuration: '6s' }} />
            <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <div className="absolute w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
          </div>
          <span className="text-[10px] font-bold text-sky-400 mt-3 tracking-widest uppercase animate-pulse">
            Retrieving...
          </span>
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-60 animate-scan" />
        </div>
      )}

      <img
        src={imageSrc}
        alt={file.file_name}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.04] ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      />
    </div>
  );
};

export default function App() {
  // App Version in Header - Incremented to v2.0.3
  const APP_VERSION = "v2.0.3";

  // Dynamic Public Branding from MySQL with LocalStorage Cache (Instant loading & zero redundant requests)
  const [publicBranding, setPublicBranding] = useState<{
    brand_name?: string;
    app_tagline?: string;
    app_logo_url?: string;
    app_favicon_url?: string;
    app_badge_text?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
    support_telegram_url?: string;
    support_discord_url?: string;
    github_url?: string;
    twitter_url?: string;
    copyright_text?: string;
    enable_public_pricing?: boolean;
    enable_contact_form?: boolean;
    enable_api_console?: boolean;
  }>(() => {
    try {
      const cached = localStorage.getItem('telecloud_public_branding');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      brand_name: 'TeleCloud Vault',
      app_tagline: 'Decentralized MTProto Cloud Storage & High-Speed Direct CDN',
      app_badge_text: 'MTProto 2.0 Cloud',
    };
  });

  const fetchPublicBranding = async () => {
    try {
      const res = await safeJsonFetch('/api/public-settings');
      if (res?.success && res.settings) {
        setPublicBranding(res.settings);
        try {
          localStorage.setItem('telecloud_public_branding', JSON.stringify(res.settings));
        } catch {}
        if (res.settings.brand_name) {
          document.title = `${res.settings.brand_name} - Decentralized Cloud Vault`;
        }
        if (res.settings.app_favicon_url) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = res.settings.app_favicon_url;
        }
      }
    } catch (e) {
      console.warn('Notice loading public branding:', e);
    }
  };

  // =========================================================================
  // APP LOCK (Web GUI Dashboard PIN Protection configured in .env)
  // Blocks access to web GUI dashboard while leaving public file CDN active
  // =========================================================================
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const sessionToken = sessionStorage.getItem('telecloud_dashboard_pin_unlocked');
      const localToken = localStorage.getItem('telecloud_dashboard_pin_unlocked');
      return !(sessionToken || localToken);
    }
    return true;
  });
  const [appLockPin, setAppLockPin] = useState<string>('');
  const [appLockError, setAppLockError] = useState<string>('');
  const [appLockLoading, setAppLockLoading] = useState<boolean>(false);
  const [showAppLockPin, setShowAppLockPin] = useState<boolean>(false);
  const [rememberLockSession, setRememberLockSession] = useState<boolean>(true);
  const [appLockShaking, setAppLockShaking] = useState<boolean>(false);

  useEffect(() => {
    const token = sessionStorage.getItem('telecloud_dashboard_pin_unlocked') || localStorage.getItem('telecloud_dashboard_pin_unlocked');
    if (token) {
      safeJsonFetch('/api/app-lock/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).then((res) => {
        if (!res?.valid) {
          sessionStorage.removeItem('telecloud_dashboard_pin_unlocked');
          localStorage.removeItem('telecloud_dashboard_pin_unlocked');
          setIsAppLocked(true);
        } else {
          setIsAppLocked(false);
        }
      }).catch(() => {});
    }
  }, []);

  const handleUnlockApp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockPin.trim()) {
      setAppLockError('Please enter your Dashboard PIN.');
      triggerLockShake();
      return;
    }
    setAppLockLoading(true);
    setAppLockError('');
    try {
      const res = await safeJsonFetch('/api/app-lock/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: appLockPin.trim() }),
      });
      if (res?.success && res.token) {
        if (rememberLockSession) {
          localStorage.setItem('telecloud_dashboard_pin_unlocked', res.token);
        }
        sessionStorage.setItem('telecloud_dashboard_pin_unlocked', res.token);
        setIsAppLocked(false);
        setAppLockPin('');
        setAppLockError('');
      } else {
        setAppLockError(res?.error || 'Incorrect Dashboard PIN. Please try again.');
        triggerLockShake();
      }
    } catch (err: any) {
      setAppLockError(err?.message || 'Incorrect PIN. Please try again.');
      triggerLockShake();
    } finally {
      setAppLockLoading(false);
    }
  };

  const handleLockApp = () => {
    sessionStorage.removeItem('telecloud_dashboard_pin_unlocked');
    localStorage.removeItem('telecloud_dashboard_pin_unlocked');
    setIsAppLocked(true);
    setAppLockPin('');
    setAppLockError('');
  };

  const triggerLockShake = () => {
    setAppLockShaking(true);
    setTimeout(() => setAppLockShaking(false), 500);
  };

  // Routing State for Public Marketing Pages & Deep Links
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (['/features', '/benefits', '/architecture', '/streaming-cdn', '/streaming', '/security', '/pricing', '/contact', '/admin', '/login', '/register'].includes(path)) {
        return path;
      }
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/admin' || hash === '#admin') {
        return '/admin';
      }
    }
    return '/';
  });

  const navigate = (path: string) => {
    setCurrentRoute(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      setCurrentRoute(path || '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Dark Mode Theme State (Defaulting strictly to Light Mode for initial/default experience)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('telecloud_theme');
    if (saved) return saved === 'dark';
    return false; // Default to light mode
  });

  useEffect(() => {
    localStorage.setItem('telecloud_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      document.body.classList.add('bg-slate-950', 'text-slate-100');
      document.body.classList.remove('bg-slate-50', 'text-slate-800');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-800');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Interactive Landing Page states
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [simStep, setSimStep] = useState<'idle' | 'uploading' | 'indexing' | 'ready'>('idle');
  const [simProgress, setSimProgress] = useState(0);

  // Dynamic theme class helpers
  const containerBg = darkMode
    ? 'bg-slate-950 text-slate-100'
    : 'bg-gradient-to-br from-slate-50 via-sky-50/20 to-indigo-50/30 text-slate-800';

  const cardBg = darkMode
    ? 'bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 text-slate-100 shadow-xl'
    : 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 text-slate-900 shadow-xs';

  const subCardBg = darkMode
    ? 'bg-slate-950/80 border border-slate-800/90 text-slate-200'
    : 'bg-slate-50/90 border border-slate-200/80 text-slate-800';

  const headerBg = darkMode
    ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl'
    : 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs';

  const sidebarBg = darkMode
    ? 'bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 text-slate-200'
    : 'bg-white/95 backdrop-blur-xl border-r border-slate-200/80 text-slate-800';

  const dropdownBg = darkMode
    ? 'bg-slate-900/98 backdrop-blur-2xl border border-slate-800 text-white shadow-2xl'
    : 'bg-white/98 backdrop-blur-2xl border border-slate-200 text-slate-900 shadow-2xl';

  const inputBg = darkMode
    ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 shadow-inner'
    : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs';

  const modalBg = darkMode
    ? 'bg-slate-900/95 backdrop-blur-2xl border border-slate-800 text-white shadow-2xl'
    : 'bg-white/95 backdrop-blur-2xl border border-slate-200/90 text-slate-900 shadow-2xl';

  const tableHeaderBg = darkMode
    ? 'bg-slate-950/90 text-slate-400 border-b border-slate-800'
    : 'bg-slate-50/90 text-slate-500 border-b border-slate-200';

  // Navigation: For logged-in dashboard vs landing
  // Clean user-focused tabs with dedicated API Console & Simulator
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'workspaces' | 'upload' | 'vault' | 'analytics' | 'streamer' | 'links' | 'api' | 'settings'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Connection & Auth State
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [connectivityLost, setConnectivityLost] = useState<boolean>(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [storageChat, setStorageChat] = useState<string>('me');
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Multi-Tenant Web Account State (Username & Password Registration / Login)
  const [webUser, setWebUser] = useState<{
    id: number;
    username: string;
    telegram_id: string | null;
    storage_chat: string;
  } | null>(null);
  const [webAuthMode, setWebAuthMode] = useState<'login' | 'register'>('login');
  const [webUsernameInput, setWebUsernameInput] = useState<string>('');
  const [webPasswordInput, setWebPasswordInput] = useState<string>('');
  const [webConfirmPasswordInput, setWebConfirmPasswordInput] = useState<string>('');
  const [webAuthError, setWebAuthError] = useState<string | null>(null);
  const [webAuthLoading, setWebAuthLoading] = useState<boolean>(false);
  const [storageTargetMode, setStorageTargetMode] = useState<'me' | 'custom'>('me');

  useEffect(() => {
    if (currentRoute === '/login') {
      setWebAuthMode('login');
      setShowAuthModal(true);
    } else if (currentRoute === '/register') {
      setWebAuthMode('register');
      setShowAuthModal(true);
    }
  }, [currentRoute]);

  // MySQL Database Connection Health & Error State
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbStatusDetails, setDbStatusDetails] = useState<{ host?: string; port?: number; user?: string; database?: string } | null>(null);
  const [checkingDb, setCheckingDb] = useState<boolean>(false);

  // Multi-Workspace State (Multiple Workspaces connected to Telegram Account in MySQL)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState<boolean>(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState<boolean>(false);
  const [vaultWorkspaceFilter, setVaultWorkspaceFilter] = useState<string>('all');
  const [uploadWorkspaceId, setUploadWorkspaceId] = useState<number | null>(null);

  // Workspace Modals & Actions
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [newWorkspaceStorageChat, setNewWorkspaceStorageChat] = useState<string>('me');
  const [creatingWorkspace, setCreatingWorkspace] = useState<boolean>(false);

  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState<string>('');
  const [editWorkspaceStorageChat, setEditWorkspaceStorageChat] = useState<string>('me');
  const [savingWorkspace, setSavingWorkspace] = useState<boolean>(false);

  const [reassignFileModal, setReassignFileModal] = useState<StorageFile | null>(null);
  const [reassignTargetWorkspaceId, setReassignTargetWorkspaceId] = useState<number | null>(null);
  const [reassigningFile, setReassigningFile] = useState<boolean>(false);

  // QR Code Generation & Display Modal State
  const [qrModalFile, setQrModalFile] = useState<StorageFile | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!qrModalFile) {
      setQrDataUrl('');
      return;
    }
    const rawLink = qrModalFile.direct_link || `/api/download/${qrModalFile.message_id}/${encodeURIComponent(qrModalFile.file_name)}`;
    const fullDirectUrl = rawLink.startsWith('http') ? rawLink : `${window.location.origin}${rawLink}`;
    setQrLoading(true);
    QRCode.toDataURL(fullDirectUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      })
      .finally(() => {
        setQrLoading(false);
      });
  }, [qrModalFile]);

  // API Key & Backend Integrity Verification State
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [regeneratingApiKey, setRegeneratingApiKey] = useState<boolean>(false);
  const [verifyingApi, setVerifyingApi] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  const fetchUserApiKey = async () => {
    try {
      const data = await safeJsonFetch(user?.id ? `/api/user/api-key?telegram_id=${user.id}` : '/api/user/api-key');
      if (data?.api_key) {
        setUserApiKey(data.api_key);
      }
    } catch (e) {
      console.warn('Could not fetch user API key:', e);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!window.confirm('Regenerate API Key? Any external scripts or integrations using your current key will stop working until updated.')) {
      return;
    }
    setRegeneratingApiKey(true);
    try {
      const data = await safeJsonFetch('/api/user/api-key/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: user?.id })
      });
      if (data?.api_key) {
        setUserApiKey(data.api_key);
        setVerifyResult(null);
      }
    } catch (e) {
      console.error('Failed to regenerate API key:', e);
    } finally {
      setRegeneratingApiKey(false);
    }
  };

  const handleTestApiIntegrity = async () => {
    setVerifyingApi(true);
    try {
      const res = await safeJsonFetch('/api/v1/verify', {
        headers: {
          'x-api-key': userApiKey,
        }
      });
      setVerifyResult(res);
    } catch (e: any) {
      setVerifyResult({ success: false, error: e.message || 'Verification failed' });
    } finally {
      setVerifyingApi(false);
    }
  };

  // Custom Device Identity & Location / Proxy State (Avoid "PC 64bit" in Telegram)
  const [deviceModel, setDeviceModel] = useState<string>('TeleCloud Vault');
  const [systemVersion, setSystemVersion] = useState<string>('macOS Sonoma 14.5');
  const [deviceAppVersion, setDeviceAppVersion] = useState<string>('TeleCloud Vault v1.5.1');
  const [proxyUrl, setProxyUrl] = useState<string>('');
  const [serverLocation, setServerLocation] = useState<{ ip?: string; city?: string; region?: string; country?: string; country_code?: string; org?: string } | null>(null);
  const [savingDeviceConfig, setSavingDeviceConfig] = useState<boolean>(false);
  const [deviceSuccessMsg, setDeviceSuccessMsg] = useState<string | null>(null);
  const [showAdvancedDeviceLogin, setShowAdvancedDeviceLogin] = useState<boolean>(false);

  const DEVICE_PRESETS = [
    {
      name: 'TeleCloud Cloud Vault',
      device: 'TeleCloud Vault',
      system: 'macOS Sonoma 14.5',
      app: 'TeleCloud Vault v1.5.1',
      badge: 'Default Recommended',
      icon: 'cloud'
    },
    {
      name: 'Apple MacBook Pro',
      device: 'MacBook Pro 16"',
      system: 'macOS Sonoma 14.5',
      app: 'Telegram Desktop 5.4.1',
      badge: 'macOS Desktop',
      icon: 'laptop'
    },
    {
      name: 'Apple iPhone 16 Pro',
      device: 'iPhone 16 Pro Max',
      system: 'iOS 18.0',
      app: 'Telegram iOS 11.1',
      badge: 'Apple iOS',
      icon: 'smartphone'
    },
    {
      name: 'Windows 11 Workstation',
      device: 'Windows Workstation',
      system: 'Windows 11 Pro',
      app: 'Telegram Desktop 5.4.1',
      badge: 'Windows PC',
      icon: 'monitor'
    },
    {
      name: 'Samsung Galaxy S24',
      device: 'Samsung Galaxy S24 Ultra',
      system: 'Android 14',
      app: 'Telegram Android 10.14',
      badge: 'Android Device',
      icon: 'smartphone'
    }
  ];

  const fetchDeviceConfig = async () => {
    try {
      const res = await safeJsonFetch('/api/device-config');
      if (res?.device_model) setDeviceModel(res.device_model);
      if (res?.system_version) setSystemVersion(res.system_version);
      if (res?.app_version) setDeviceAppVersion(res.app_version);
      if (res?.proxy_url) setProxyUrl(res.proxy_url);
      if (res?.location) setServerLocation(res.location);
    } catch (e) {
      console.warn('Notice fetching device config:', e);
    }
  };

  const handleSaveDeviceConfig = async () => {
    setSavingDeviceConfig(true);
    try {
      const res = await safeJsonFetch('/api/device-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_model: deviceModel,
          system_version: systemVersion,
          app_version: deviceAppVersion,
          proxy_url: proxyUrl,
        }),
      });
      if (res?.location) setServerLocation(res.location);
      setDeviceSuccessMsg('Device & Location identity saved! New Telegram sessions will appear with this custom device.');
      setTimeout(() => setDeviceSuccessMsg(null), 5000);
    } catch (e: any) {
      console.error('Error saving device config:', e);
    } finally {
      setSavingDeviceConfig(false);
    }
  };

  // Available Chats for Visual Storage Destination Picker
  const [availableChats, setAvailableChats] = useState<StorageChatOption[]>([
    {
      id: 'me',
      title: 'Self (Saved Messages)',
      type: 'self',
      is_self: true,
      badge: 'Private & Default',
      description: 'Your personal Telegram Saved Messages chat. 100% private to you.'
    }
  ]);
  const [loadingChats, setLoadingChats] = useState<boolean>(false);
  const [chatSuccessMessage, setChatSuccessMessage] = useState<string | null>(null);
  const [customChatId, setCustomChatId] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings / Connect form (Defaults to Live Phone Number & Telegram OTP)
  const [authMode, setAuthMode] = useState<'qr' | 'phone' | 'bot' | 'session'>('phone');
  const [apiId, setApiId] = useState<string>('');
  const [apiHash, setApiHash] = useState<string>('');
  const [botToken, setBotToken] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]);
  const [nationalPhone, setNationalPhone] = useState<string>('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState<boolean>(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');
  const [stringSession, setStringSession] = useState<string>('');
  const [targetChatInput, setTargetChatInput] = useState<string>('me');
  const [secretsConfigured, setSecretsConfigured] = useState<boolean>(false);

  // Session File Import & Export States
  const [uploadedSessionFileName, setUploadedSessionFileName] = useState<string | null>(null);
  const [uploadedSessionUser, setUploadedSessionUser] = useState<any | null>(null);
  const [sessionFileError, setSessionFileError] = useState<string | null>(null);
  const [isDraggingSessionFile, setIsDraggingSessionFile] = useState<boolean>(false);
  const [showRawSessionText, setShowRawSessionText] = useState<boolean>(false);
  const sessionFileInputRef = useRef<HTMLInputElement>(null);

  // Session Export Modal State
  const [showSessionExportModal, setShowSessionExportModal] = useState<boolean>(false);
  const [imageErrors, setImageErrors] = useState<Record<string | number, boolean>>({});
  const [exportingSession, setExportingSession] = useState<boolean>(false);
  const [sessionExportData, setSessionExportData] = useState<any | null>(null);
  const [copiedSessionStr, setCopiedSessionStr] = useState<boolean>(false);
  
  // QR Code Login Flow
  const [loginQrDataUrl, setLoginQrDataUrl] = useState<string | null>(null);
  const [loginQrLoading, setLoginQrLoading] = useState<boolean>(false);
  const qrPollTimerRef = useRef<any>(null);
  const qrRefreshTimerRef = useRef<any>(null);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workspaceDropdownOpen &&
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setWorkspaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [workspaceDropdownOpen]);

  // Phone login flow
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string>('');
  const [twoFaPassword, setTwoFaPassword] = useState<string>('');
  const [needs2FA, setNeeds2FA] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

  // File Upload State (Single & Bulk Queue)
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [customUploadName, setCustomUploadName] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<StorageFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Bulk Upload State
  const [uploadQueue, setUploadQueue] = useState<BulkUploadItem[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState<boolean>(false);
  const [activeUploadIndex, setActiveUploadIndex] = useState<number>(-1);
  const [bulkUploadPassword, setBulkUploadPassword] = useState<string>('');
  const [bulkUploadCaption, setBulkUploadCaption] = useState<string>('');
  const [isBulkDragging, setIsBulkDragging] = useState<boolean>(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [copiedBatchAll, setCopiedBatchAll] = useState<boolean>(false);
  const [uploadTabMode, setUploadTabMode] = useState<'bulk' | 'single'>('bulk');

  // Overview Drag-and-Drop Uploader State (Supports multi-file batch)
  const [overviewFiles, setOverviewFiles] = useState<BulkUploadItem[]>([]);
  const [overviewPassword, setOverviewPassword] = useState<string>('');
  const [isOverviewDragging, setIsOverviewDragging] = useState<boolean>(false);
  const [overviewUploading, setOverviewUploading] = useState<boolean>(false);
  const [overviewActiveIndex, setOverviewActiveIndex] = useState<number>(-1);
  const [overviewWorkspaceId, setOverviewWorkspaceId] = useState<string>('');
  const [overviewCopiedBatchAll, setOverviewCopiedBatchAll] = useState<boolean>(false);
  const overviewFileInputRef = useRef<HTMLInputElement>(null);
  // Analytics & Cleanup State
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'most_accessed' | 'never_accessed' | 'unaccessed_7_days' | 'unaccessed_30_days'>('all');
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsStats, setAnalyticsStats] = useState<any | null>(null);
  const [analyticsFiles, setAnalyticsFiles] = useState<any[]>([]);
  const [selectedAnalyticsFileIds, setSelectedAnalyticsFileIds] = useState<string[]>([]);
  const [cleanupModalRule, setCleanupModalRule] = useState<'not_accessed_7_days' | 'never_accessed' | 'not_accessed_30_days' | 'custom' | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState<boolean>(false);
  const [cleanupSuccessNotice, setCleanupSuccessNotice] = useState<string | null>(null);

  // Files List & Rename
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [fileSearch, setFileSearch] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  
  // File Sorting State: date_desc, date_asc, name_asc, name_desc, size_desc, size_asc
  type FileSortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
  const [fileSort, setFileSort] = useState<FileSortKey>('date_desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSortClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener('mousedown', handleSortClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleSortClickOutside);
    };
  }, [sortDropdownOpen]);

  const [editingFile, setEditingFile] = useState<StorageFile | null>(null);
  const [newFileNameInput, setNewFileNameInput] = useState<string>('');
  const [renamingLoading, setRenamingLoading] = useState<boolean>(false);

  // Checkbox selection system & Bulk Actions State
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [manifestModalOpen, setManifestModalOpen] = useState<boolean>(false);
  const [manifestData, setManifestData] = useState<any | null>(null);
  const [loadingManifest, setLoadingManifest] = useState<boolean>(false);

  // Direct Link Modal / Viewer
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [activeMediaStream, setActiveMediaStream] = useState<StorageFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQrForLink, setShowQrForLink] = useState<string | null>(null);

  // Account Deletion Flow State
  const [deleteTelegramFiles, setDeleteTelegramFiles] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);

  // Fetch Old Telegram Files State
  const [isFetchingOldFiles, setIsFetchingOldFiles] = useState<boolean>(false);
  const [fetchOldFilesStatus, setFetchOldFilesStatus] = useState<string | null>(null);

  // Active Workspace Live File Count & Storage Metric
  const activeWorkspaceFileCount = useMemo(() => {
    if (!activeWorkspace) return files.length;
    const matching = files.filter(
      (f) => String(f.workspace_id) === String(activeWorkspace.id) || (!f.workspace_id && activeWorkspace.is_default)
    );
    if (matching.length > 0) return matching.length;
    return activeWorkspace.file_count ?? 0;
  }, [activeWorkspace, files]);

  const activeWorkspaceBytes = useMemo(() => {
    if (!activeWorkspace) return stats?.totalBytes || 0;
    const matching = files.filter(
      (f) => String(f.workspace_id) === String(activeWorkspace.id) || (!f.workspace_id && activeWorkspace.is_default)
    );
    if (matching.length > 0) {
      return matching.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0);
    }
    return activeWorkspace.total_bytes ?? 0;
  }, [activeWorkspace, files, stats]);

  const checkDbStatus = async () => {
    setCheckingDb(true);
    try {
      const res = await fetch('/api/db/status');
      if (!res.ok) {
        setDbConnected(false);
        setDbError(`MySQL database service unreachable (HTTP ${res.status}).`);
        return false;
      }
      const data = await res.json();
      if (data && data.connected === false) {
        setDbConnected(false);
        setDbError(data.error || 'Failed to establish connection to MySQL database.');
        setDbStatusDetails({
          host: data.host,
          port: data.port,
          user: data.user,
          database: data.database,
        });
        return false;
      } else {
        setDbConnected(true);
        setDbError(null);
        if (data) {
          setDbStatusDetails({
            host: data.host,
            port: data.port,
            user: data.user,
            database: data.database,
          });
        }
        return true;
      }
    } catch (err: any) {
      setDbConnected(false);
      setDbError(err.message || 'Unable to connect to MySQL database service.');
      return false;
    } finally {
      setCheckingDb(false);
    }
  };

  // Initial check on load and silent background polling for MySQL connection
  useEffect(() => {
    checkDbStatus();
    checkStatus();
    fetchDeviceConfig();
    fetchPublicBranding();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkDbStatus();
    }, dbConnected ? 15000 : 3000);

    return () => clearInterval(interval);
  }, [dbConnected]);

  useEffect(() => {
    if ((connected || webUser) && dbConnected) {
      fetchWorkspaces();
      fetchFiles();
      fetchStats();
      fetchAvailableChats();
      fetchUserApiKey();
      fetchDeviceConfig();
    }
  }, [connected, user, webUser, dbConnected]);

  const safeJsonFetch = async (url: string, options?: RequestInit) => {
    const webToken = typeof window !== 'undefined' ? (localStorage.getItem('telecloud_web_token') || '') : '';
    const mergedHeaders: Record<string, string> = {
      ...(options?.headers as Record<string, string> || {}),
    };
    if (webToken && !mergedHeaders['x-auth-token']) {
      mergedHeaders['x-auth-token'] = webToken;
    }

    const res = await fetch(url, {
      ...options,
      headers: mergedHeaders,
    });
    const text = await res.text();
    let data: any = null;
    const isJson = (res.headers.get('content-type') || '').includes('application/json') ||
                   text.trim().startsWith('{') ||
                   text.trim().startsWith('[');
    if (isJson) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      let cleanErr = data?.error || data?.message;
      if (!cleanErr) {
        cleanErr = text.replace(/<[^>]*>/g, '').trim().slice(0, 200);
        if (cleanErr.includes('<!DOCTYPE') || cleanErr.length === 0) {
          cleanErr = `Server returned HTTP ${res.status}. Please check backend logs or try again.`;
        }
      }
      throw new Error(cleanErr);
    }

    return data || { message: text };
  };

  const checkStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await safeJsonFetch('/api/status');
      const isConn = Boolean(data?.connected);
      const isConnLost = Boolean(data?.connectivity_lost || data?.reconnect_required);
      setConnected(isConn);
      setConnectivityLost(isConnLost);
      if (data?.web_user) {
        setWebUser(data.web_user);
      } else {
        setWebUser(null);
      }
      if (data?.user_session?.expires_at) {
        setSessionExpiresAt(data.user_session.expires_at);
      }
      if (data?.user && isConn) {
        setUser(data.user);
        localStorage.setItem('telecloud_user_tg_id', String(data.user.id));
      } else {
        setUser(null);
      }
      if (data?.storage_chat) {
        setStorageChat(data.storage_chat);
        setTargetChatInput(data.storage_chat);
        setStorageTargetMode(data.storage_chat === 'me' ? 'me' : 'custom');
      }
      setHasSession(Boolean(data?.has_session));
      if (data?.api_id) {
        setApiId(String(data.api_id));
        setSecretsConfigured(true);
      }
      if (data?.api_hash) {
        setApiHash(String(data.api_hash));
      }
    } catch (e: any) {
      console.warn('Status check notice:', e?.message || e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleWebAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebAuthError(null);
    const cleanUsername = webUsernameInput.trim();
    if (!cleanUsername || !webPasswordInput) {
      setWebAuthError('Please enter both username and password.');
      return;
    }
    if (webAuthMode === 'register' && webPasswordInput !== webConfirmPasswordInput) {
      setWebAuthError('Passwords do not match.');
      return;
    }

    setWebAuthLoading(true);
    try {
      const endpoint = webAuthMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const data = await safeJsonFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: webPasswordInput,
        }),
      });

      if (data?.token) {
        localStorage.setItem('telecloud_web_token', data.token);
      }
      if (data?.user) {
        setWebUser(data.user);
      }
      setWebPasswordInput('');
      setWebConfirmPasswordInput('');
      await checkStatus();
      if (currentRoute === '/login' || currentRoute === '/register') {
        navigate('/');
      }
      // If user already has an active Telegram account linked, close modal; otherwise keep modal open on Step 2 (Phone OTP)
      const statusAfter = await safeJsonFetch('/api/status');
      if (statusAfter?.connected) {
        setShowAuthModal(false);
        setDashboardTab('overview');
      } else {
        setAuthMode('phone');
        setShowAuthModal(true);
      }
    } catch (err: any) {
      setWebAuthError(err.message || 'Authentication failed.');
    } finally {
      setWebAuthLoading(false);
    }
  };

  const handleWebLogout = async () => {
    try {
      await safeJsonFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      localStorage.removeItem('telecloud_web_token');
      localStorage.removeItem('telecloud_user_tg_id');
      setWebUser(null);
      setConnected(false);
      setUser(null);
      setFiles([]);
      setWorkspaces([]);
      setActiveWorkspace(null);
      setPhoneCodeHash(null);
      setAuthCode('');
      navigate('/');
    }
  };

  const fetchWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const url = user?.id ? `/api/workspaces?telegram_id=${user.id}` : '/api/workspaces';
      const data = await safeJsonFetch(url);
      if (data.workspaces && Array.isArray(data.workspaces)) {
        setWorkspaces(data.workspaces);
        const active = data.workspaces.find((w: Workspace) => w.id === data.active_workspace_id) || data.workspaces[0] || null;
        setActiveWorkspace(active);
        setActiveWorkspaceId(data.active_workspace_id || (active ? active.id : null));
        if (active?.id && !uploadWorkspaceId) {
          setUploadWorkspaceId(active.id);
        }
        if (active?.storage_chat) {
          setStorageChat(active.storage_chat);
          setTargetChatInput(active.storage_chat);
        }
      }
    } catch (e) {
      console.error('Failed to fetch workspaces', e);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: number) => {
    try {
      const data = await safeJsonFetch(`/api/workspaces/${workspaceId}/switch`, {
        method: 'POST',
      });
      if (data.success) {
        setActiveWorkspaceId(workspaceId);
        const targetWs = workspaces.find((w) => w.id === workspaceId);
        if (targetWs) {
          setActiveWorkspace(targetWs);
          setStorageChat(targetWs.storage_chat);
          setTargetChatInput(targetWs.storage_chat);
        }
        setUploadWorkspaceId(workspaceId);
        setVaultWorkspaceFilter(String(workspaceId));
        setWorkspaceDropdownOpen(false);
        await fetchWorkspaces();
        await fetchFiles();
        await fetchStats();
      }
    } catch (err: any) {
      alert(`Could not switch workspace: ${err.message}`);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreatingWorkspace(true);
    try {
      const data = await safeJsonFetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user?.id,
          name: newWorkspaceName.trim(),
          storage_chat: newWorkspaceStorageChat.trim() || 'me',
        }),
      });
      if (data.success) {
        setCreateWorkspaceModalOpen(false);
        setNewWorkspaceName('');
        setNewWorkspaceStorageChat('me');
        await fetchWorkspaces();
        if (data.workspace?.id) {
          await handleSwitchWorkspace(data.workspace.id);
        }
      }
    } catch (err: any) {
      alert(`Error creating workspace: ${err.message}`);
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace || !editWorkspaceName.trim()) return;
    setSavingWorkspace(true);
    try {
      const data = await safeJsonFetch(`/api/workspaces/${editingWorkspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user?.id,
          name: editWorkspaceName.trim(),
          storage_chat: editWorkspaceStorageChat.trim() || 'me',
        }),
      });
      if (data.success) {
        setEditingWorkspace(null);
        await fetchWorkspaces();
        await fetchFiles();
      }
    } catch (err: any) {
      alert(`Error updating workspace: ${err.message}`);
    } finally {
      setSavingWorkspace(false);
    }
  };

  const handleReassignFileWorkspace = async () => {
    if (!reassignFileModal || !reassignTargetWorkspaceId) return;
    setReassigningFile(true);
    try {
      const data = await safeJsonFetch('/api/files/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user?.id,
          message_id: reassignFileModal.message_id,
          workspace_id: reassignTargetWorkspaceId,
        }),
      });
      if (data.success) {
        setReassignFileModal(null);
        await fetchWorkspaces();
        await fetchFiles();
        await fetchStats();
      }
    } catch (err: any) {
      alert(`Error reassigning file: ${err.message}`);
    } finally {
      setReassigningFile(false);
    }
  };

  const fetchAvailableChats = async () => {
    setLoadingChats(true);
    try {
      const data = await safeJsonFetch('/api/storage/chats');
      if (data.dialogs && data.dialogs.length > 0) {
        setAvailableChats(data.dialogs);
      }
      if (data.current) {
        setStorageChat(data.current);
        setTargetChatInput(data.current);
      }
    } catch (e) {
      console.error('Failed to fetch storage chats', e);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchStats = async () => {
    try {
      const url = user?.id ? `/api/user/stats?telegram_id=${user.id}` : '/api/user/stats';
      const data = await safeJsonFetch(url);
      if (data) {
        setStats(data);
      }
    } catch (e: any) {
      console.warn('Could not fetch stats:', e.message || e);
    }
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const url = user?.id ? `/api/user/files?telegram_id=${user.id}` : '/api/user/files';
      const data = await safeJsonFetch(url);
      if (data?.files && data.files.length > 0) {
        const enriched = data.files.map((f: any) => {
          const wsRecord = workspaces.find((w) => Number(w.id) === Number(f.workspace_id));
          const resolvedWsName = f.workspace_name || wsRecord?.name || 'Default Workspace';
          const resolvedStorageChat = f.storage_chat || wsRecord?.storage_chat || 'me';
          return {
            ...f,
            workspace_id: f.workspace_id,
            workspace_name: resolvedWsName,
            storage_chat: resolvedStorageChat,
            direct_link: f.direct_link || (f.file_slug ? `${window.location.origin}/f/${f.file_slug}` : `${window.location.origin}/api/download/${f.message_id}/${encodeURIComponent(f.file_name)}`),
            telegram_link: resolvedStorageChat.startsWith('-100')
              ? `https://t.me/c/${resolvedStorageChat.replace('-100', '')}/${f.message_id}`
              : `https://t.me/me`
          };
        });
        setFiles(enriched);
      } else {
        const tgData = await safeJsonFetch('/api/files');
        if (tgData?.files) {
          const enriched = tgData.files.map((f: any) => ({
            ...f,
            workspace_id: activeWorkspace?.id || null,
            workspace_name: activeWorkspace?.name || 'Default Workspace',
            storage_chat: storageChat || 'me',
            direct_link: `${window.location.origin}/api/download/${f.message_id}/${encodeURIComponent(f.file_name)}`,
            telegram_link: storageChat.startsWith('-100')
              ? `https://t.me/c/${storageChat.replace('-100', '')}/${f.message_id}`
              : `https://t.me/me`
          }));
          setFiles(enriched);
        }
      }
    } catch (e: any) {
      console.warn('Could not fetch files:', e.message || e);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFetchOldFiles = async () => {
    setIsFetchingOldFiles(true);
    setFetchOldFilesStatus(null);
    try {
      const targetWsId = activeWorkspace?.id || null;
      const targetChat = activeWorkspace?.storage_chat || storageChat || 'me';
      const res = await fetch('/api/files/fetch-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user?.id,
          workspace_id: targetWsId,
          storage_chat: targetChat,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchFiles();
        await fetchStats();
        await fetchWorkspaces();
        setFetchOldFilesStatus(
          data.message || `Successfully imported ${data.imported_count || 0} historical files from Telegram into MySQL!`
        );
        setTimeout(() => setFetchOldFilesStatus(null), 6000);
      } else {
        alert(data.error || 'Failed to scan channel media from Telegram.');
      }
    } catch (err: any) {
      alert(`Error scanning channel history: ${err.message}`);
    } finally {
      setIsFetchingOldFiles(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const targetWsId = activeWorkspaceId ? String(activeWorkspaceId) : '';
      const url = `/api/user/analytics?filter=${analyticsFilter}${targetWsId ? `&workspace_id=${targetWsId}` : ''}${user?.id ? `&telegram_id=${user.id}` : ''}`;
      const data = await safeJsonFetch(url);
      if (data && data.success) {
        setAnalyticsStats(data.stats || null);
        setAnalyticsFiles(data.files || []);
      }
    } catch (err: any) {
      console.warn('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleExecuteCleanup = async () => {
    if (!cleanupModalRule) return;
    setIsCleaningUp(true);
    setCleanupSuccessNotice(null);

    try {
      const res = await fetch('/api/user/analytics/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user?.id,
          rule: cleanupModalRule,
          file_ids: cleanupModalRule === 'custom' ? selectedAnalyticsFileIds : [],
          delete_from_telegram: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Cleanup operation failed.');
      }

      const result = await res.json();
      setCleanupSuccessNotice(result.message || `Purged ${result.deletedCount} unaccessed file(s)!`);
      setSelectedAnalyticsFileIds([]);
      setCleanupModalRule(null);
      await fetchAnalytics();
      await fetchFiles();
      await fetchStats();
      setTimeout(() => setCleanupSuccessNotice(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Cleanup operation failed.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  useEffect(() => {
    if (dashboardTab === 'analytics' && connected) {
      fetchAnalytics();
    }
  }, [dashboardTab, analyticsFilter, activeWorkspaceId, connected]);

  const selectStorageDestination = async (chatId: string, title?: string, wsId?: number) => {
    const targetWsId = wsId || activeWorkspace?.id;
    try {
      const data = await safeJsonFetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_chat: chatId, workspace_id: targetWsId }),
      });
      if (data.success) {
        setStorageChat(data.storage_chat);
        setTargetChatInput(data.storage_chat);
        setCustomChatId(data.storage_chat);
        setChatSuccessMessage(`Storage destination updated to "${title || data.entity_name || data.storage_chat}" for ${activeWorkspace?.name || 'active workspace'}`);
        setTimeout(() => setChatSuccessMessage(null), 3500);
        await fetchWorkspaces();
      }
    } catch (e: any) {
      alert(`Could not switch storage destination: ${e.message}`);
    }
  };

  const handleCustomChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customChatId.trim()) return;
    selectStorageDestination(customChatId.trim(), `Custom Chat (${customChatId.trim()})`);
  };

  useEffect(() => {
    if (storageChat && storageChat !== 'me') {
      setCustomChatId(storageChat);
    }
  }, [storageChat]);

  const handleTestConnection = async (chatIdToTest: string) => {
    if (!chatIdToTest.trim()) return;
    setTestingConnection(true);
    setTestConnectionResult(null);
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_chat: chatIdToTest.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestConnectionResult({
          success: true,
          message: `Connection Verified! Successfully resolved entity: "${data.entity_name || chatIdToTest.trim()}"`
        });
      } else {
        setTestConnectionResult({
          success: false,
          message: data.error || 'Failed to resolve entity. Make sure your bot is an Administrator in this channel or group.'
        });
      }
    } catch (err: any) {
      setTestConnectionResult({
        success: false,
        message: err.message || 'Connection test failed.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const validatePhoneNumber = (country: CountryInfo, digits: string) => {
    if (!digits) {
      return { valid: false, message: `Please enter your ${country.name} mobile number.` };
    }
    const expected = country.digits;
    if (typeof expected === 'number') {
      if (digits.length < expected) {
        return {
          valid: false,
          message: `${country.name} phone number requires ${expected} digits (${digits.length}/${expected} entered).`,
        };
      }
      if (digits.length > expected) {
        return {
          valid: false,
          message: `${country.name} phone number must be exactly ${expected} digits (currently ${digits.length}).`,
        };
      }
      return {
        valid: true,
        message: `Valid ${expected}-digit ${country.name} mobile number.`,
      };
    } else if (Array.isArray(expected)) {
      const min = Math.min(...expected);
      const max = Math.max(...expected);
      if (digits.length < min) {
        return {
          valid: false,
          message: `${country.name} requires at least ${min} digits (${digits.length}/${min} entered).`,
        };
      }
      if (digits.length > max) {
        return {
          valid: false,
          message: `${country.name} phone number cannot exceed ${max} digits.`,
        };
      }
      return {
        valid: true,
        message: `Valid ${digits.length}-digit ${country.name} mobile number.`,
      };
    }
    return { valid: true, message: 'Valid format.' };
  };

  const handleNationalPhoneChange = (inputVal: string) => {
    let val = inputVal.trim();
    // Auto-detect and strip pasted country code
    const dialDigits = selectedCountry.dialCode.replace(/[^\d]/g, '');
    if (selectedCountry.code === 'IN') {
      if (val.startsWith('+91')) {
        val = val.slice(3);
      } else if (val.startsWith('91') && val.length > 10) {
        val = val.slice(2);
      } else if (val.startsWith('0') && val.length > 10) {
        val = val.slice(1);
      }
    } else if (dialDigits && val.startsWith(`+${dialDigits}`)) {
      val = val.slice(dialDigits.length + 1);
    } else if (dialDigits && val.startsWith(dialDigits) && val.length > 10) {
      val = val.slice(dialDigits.length);
    }

    // Strip non-digits
    const cleanDigits = val.replace(/[^\d]/g, '');
    setNationalPhone(cleanDigits);
    const full = selectedCountry.dialCode === '+' ? `+${cleanDigits}` : `${selectedCountry.dialCode}${cleanDigits}`;
    setPhone(full);
  };

  const handleCountrySelect = (c: CountryInfo) => {
    setSelectedCountry(c);
    setCountryDropdownOpen(false);
    setCountrySearchTerm('');
    const cleanDigits = nationalPhone.replace(/[^\d]/g, '');
    const full = c.dialCode === '+' ? `+${cleanDigits}` : `${c.dialCode}${cleanDigits}`;
    setPhone(full);
  };

  const stopQrPolling = () => {
    if (qrPollTimerRef.current) {
      clearInterval(qrPollTimerRef.current);
      qrPollTimerRef.current = null;
    }
  };

  const handleStartQrLogin = async (isSecret: boolean = false) => {
    if (!isSecret) {
      stopQrPolling();
      setLoginQrLoading(true);
      setAuthError(null);
    }
    try {
      const data = await safeJsonFetch('/api/qr/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_id: apiId || undefined,
          api_hash: apiHash || undefined,
          storage_chat: targetChatInput || 'me',
          device_model: deviceModel || undefined,
          system_version: systemVersion || undefined,
          app_version: deviceAppVersion || undefined,
          proxy_url: proxyUrl || undefined
        })
      });

      if (data.token_url) {
        const qrImg = await QRCode.toDataURL(data.token_url, {
          width: 240,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setLoginQrDataUrl(qrImg);

        if (!isSecret) {
          // Start polling for scan verification (Paused when tab is hidden to save Cloud Run requests)
          qrPollTimerRef.current = setInterval(async () => {
            if (document.hidden) return;
            try {
              const checkRes = await safeJsonFetch('/api/qr/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: twoFaPassword || undefined })
              });

              if (checkRes.status === 'authorized') {
                stopQrPolling();
                await checkStatus();
                setShowAuthModal(false);
                setDashboardTab('overview');
              } else if (checkRes.status === 'requires_password') {
                setNeeds2FA(true);
              } else if (checkRes.status === 'expired') {
                // Ignore expired status when we are auto-refreshing in the background anyway
              }
            } catch {
              // Keep polling quietly
            }
          }, 2500);
        }
      }
    } catch (err: any) {
      if (!isSecret) {
        setAuthError(err.message || 'Failed to initialize QR code login');
      }
    } finally {
      if (!isSecret) {
        setLoginQrLoading(false);
      }
    }
  };

  const handleVerifyQr2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!twoFaPassword.trim()) {
      setAuthError('Please enter your 2FA cloud password.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const checkRes = await safeJsonFetch('/api/qr/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: twoFaPassword.trim() })
      });
      if (checkRes.status === 'authorized') {
        stopQrPolling();
        setNeeds2FA(false);
        setTwoFaPassword('');
        await checkStatus();
        setShowAuthModal(false);
        setDashboardTab('overview');
      } else if (checkRes.error) {
        throw new Error(checkRes.error);
      }
    } catch (err: any) {
      setAuthError(err.message || '2FA Verification failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const stopQrRefresh = () => {
    if (qrRefreshTimerRef.current) {
      clearInterval(qrRefreshTimerRef.current);
      qrRefreshTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (showAuthModal && authMode === 'qr' && !connected) {
      stopQrRefresh();
      handleStartQrLogin(false);
      
      // Setup background QR refresher every 25 seconds (Paused when tab is hidden)
      qrRefreshTimerRef.current = setInterval(() => {
        if (document.hidden) return;
        handleStartQrLogin(true);
      }, 25000);
    } else {
      stopQrRefresh();
      stopQrPolling();
    }
    return () => {
      stopQrRefresh();
      stopQrPolling();
    };
  }, [showAuthModal, authMode, connected]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (authMode === 'bot') {
        if (!botToken) {
          throw new Error('Please enter your Telegram Bot Token.');
        }
        const data = await safeJsonFetch('/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_id: apiId || undefined,
            api_hash: apiHash || undefined,
            bot_token: botToken,
            storage_chat: targetChatInput || 'me',
            device_model: deviceModel || undefined,
            system_version: systemVersion || undefined,
            app_version: deviceAppVersion || undefined,
            proxy_url: proxyUrl || undefined
          })
        });
        if (data.error) throw new Error(data.error || 'Failed to connect bot.');
        await checkStatus();
        setShowAuthModal(false);
        setDashboardTab('overview');
      } else if (authMode === 'session') {
        if (!stringSession) {
          throw new Error('Please enter your Telethon String Session.');
        }
        const data = await safeJsonFetch('/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_id: apiId || undefined,
            api_hash: apiHash || undefined,
            string_session: stringSession,
            storage_chat: targetChatInput || 'me',
            device_model: deviceModel || undefined,
            system_version: systemVersion || undefined,
            app_version: deviceAppVersion || undefined,
            proxy_url: proxyUrl || undefined
          })
        });
        if (data.error) throw new Error(data.error || 'Failed to connect session.');
        await checkStatus();
        setShowAuthModal(false);
        setDashboardTab('overview');
      } else if (authMode === 'phone') {
        const cleanDigits = nationalPhone.replace(/[^\d]/g, '');
        const validation = validatePhoneNumber(selectedCountry, cleanDigits);
        if (!validation.valid) {
          throw new Error(validation.message);
        }
        const fullPhone = selectedCountry.dialCode === '+' ? `+${cleanDigits}` : `${selectedCountry.dialCode}${cleanDigits}`;
        setPhone(fullPhone);

        const data = await safeJsonFetch('/api/send_code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_id: apiId || undefined,
            api_hash: apiHash || undefined,
            phone: fullPhone,
            storage_chat: targetChatInput || 'me',
            device_model: deviceModel || undefined,
            system_version: systemVersion || undefined,
            app_version: deviceAppVersion || undefined,
            proxy_url: proxyUrl || undefined
          })
        });
        if (data.error) throw new Error(data.error || 'Failed to send OTP code.');
        setPhoneCodeHash(data.phone_code_hash);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      const fullPhone = phone || (selectedCountry.dialCode === '+' ? `+${nationalPhone.replace(/[^\d]/g, '')}` : `${selectedCountry.dialCode}${nationalPhone.replace(/[^\d]/g, '')}`);
      const data = await safeJsonFetch('/api/sign_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          code: authCode.trim(),
          phone_code_hash: phoneCodeHash,
          password: twoFaPassword || undefined
        })
      });
      if (data.error) throw new Error(data.error || 'Verification failed.');
      if (data.requires_password) {
        setNeeds2FA(true);
        setAuthError(null);
        return;
      }
      setPhoneCodeHash(null);
      setAuthCode('');
      setTwoFaPassword('');
      setNeeds2FA(false);
      await checkStatus();
      setShowAuthModal(false);
      setDashboardTab('overview');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSessionFileProcess = (file: File) => {
    setSessionFileError(null);
    setUploadedSessionFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = (e.target?.result as string || '').trim();
        if (!content) {
          throw new Error('Selected session file is empty.');
        }

        // Check if JSON format (TeleCloud session file)
        if (content.startsWith('{') && content.endsWith('}')) {
          try {
            const parsed = JSON.parse(content);
            const sess = parsed.string_session || parsed.session_str || parsed.session || parsed.stringSession;
            if (!sess) {
              throw new Error('Valid Telegram string_session not found in JSON file.');
            }
            setStringSession(sess);
            if (parsed.user) {
              setUploadedSessionUser(parsed.user);
            } else {
              setUploadedSessionUser(null);
            }
            if (parsed.api_id) setApiId(String(parsed.api_id));
            if (parsed.api_hash) setApiHash(String(parsed.api_hash));
            return;
          } catch (jsonErr: any) {
            throw new Error(jsonErr.message || 'Invalid session JSON file.');
          }
        }

        // Otherwise treat as raw Telethon string session
        setStringSession(content);
        setUploadedSessionUser(null);
      } catch (err: any) {
        setSessionFileError(err.message || 'Failed to read session file.');
        setUploadedSessionFileName(null);
        setStringSession('');
      }
    };
    reader.onerror = () => {
      setSessionFileError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDownloadSessionFile = async () => {
    try {
      setExportingSession(true);
      let exportPayload = sessionExportData;
      if (!exportPayload || !exportPayload.string_session) {
        const url = user?.id ? `/api/session/export?telegram_id=${user.id}` : '/api/session/export';
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to export session file.');
        }
        exportPayload = await res.json();
        if (exportPayload?.string_session) {
          setSessionExportData(exportPayload);
        }
      }

      if (!exportPayload?.string_session) {
        throw new Error('No active Telegram session string found to export.');
      }

      const fileData = {
        app: 'TeleCloud Vault',
        format_version: '1.0',
        type: 'telecloud_session_backup',
        user: exportPayload.user || user || null,
        string_session: exportPayload.string_session,
        created_at: new Date().toISOString(),
        instructions:
          'Keep this file safe and private. You can upload this file to TeleCloud at any time to instantly sign in without receiving an SMS or scanning a QR code.',
      };

      const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const userIdent = user?.username || user?.first_name || user?.id || 'telecloud';
      const cleanIdent = String(userIdent).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `telecloud_session_${cleanIdent}.telecloud`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to download session file.');
    } finally {
      setExportingSession(false);
    }
  };

  const handleDownloadRawSession = async (ext: 'session' | 'txt' = 'session') => {
    try {
      setExportingSession(true);
      let exportPayload = sessionExportData;
      if (!exportPayload || !exportPayload.string_session) {
        const url = user?.id ? `/api/session/export?telegram_id=${user.id}` : '/api/session/export';
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to export session.');
        }
        exportPayload = await res.json();
        if (exportPayload?.string_session) {
          setSessionExportData(exportPayload);
        }
      }

      if (!exportPayload?.string_session) {
        throw new Error('No active Telegram session string found to export.');
      }

      const blob = new Blob([exportPayload.string_session.trim()], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const userIdent = user?.username || user?.first_name || user?.id || 'telecloud';
      const cleanIdent = String(userIdent).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `telegram_session_${cleanIdent}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to download raw session string.');
    } finally {
      setExportingSession(false);
    }
  };

  const handleOpenExportModal = async () => {
    setShowSessionExportModal(true);
    setCopiedSessionStr(false);
    try {
      setExportingSession(true);
      const url = user?.id ? `/api/session/export?telegram_id=${user.id}` : '/api/session/export';
      const data = await safeJsonFetch(url);
      if (data && data.success && data.string_session) {
        setSessionExportData(data);
      }
    } catch {} finally {
      setExportingSession(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram account from your web profile?\n\nTip: You can export your session file beforehand to easily log back in without an OTP or QR scan.')) return;
    try {
      await safeJsonFetch('/api/disconnect', { method: 'POST' });
      localStorage.removeItem('telecloud_user_tg_id');
      await checkStatus();
      setFiles([]);
      setWorkspaces([]);
      setActiveWorkspace(null);
    } catch (e) {
      console.error('Error disconnecting', e);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type "DELETE" exactly to confirm account deletion.');
      return;
    }
    if (!user?.id) {
      alert('User ID not found. Deletion cancelled.');
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user.id,
          delete_telegram_files: deleteTelegramFiles,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Your account and all associated system records have been permanently deleted.');
        setConnected(false);
        setUser(null);
        setFiles([]);
        setWorkspaces([]);
        setActiveWorkspace(null);
        localStorage.removeItem('telecloud_user_tg_id');
        setShowDeleteConfirmation(false);
        setDeleteConfirmationText('');
        setDashboardTab('overview');
        navigate('/');
      } else {
        alert(data.error || 'Failed to delete account.');
      }
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteWorkspace = async (wsId: number, name: string) => {
    if (workspaces.length <= 1) {
      alert('You must keep at least one workspace. Deletion cancelled.');
      return;
    }
    const msg = `Are you sure you want to delete the workspace "${name}"?\n\n⚠️ WARNING: All cataloged file records belonging to this workspace will also be permanently deleted! This action is irreversible.`;
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/workspaces/${wsId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: user?.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Workspace "${name}" and all of its files have been deleted.`);
        await fetchWorkspaces();
        await fetchFiles();
        await fetchStats();
      } else {
        alert(data.error || 'Failed to delete workspace.');
      }
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleUpdateStorageChat = async () => {
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_chat: targetChatInput })
      });
      const data = await res.json();
      if (data.success) {
        setStorageChat(data.storage_chat);
        alert(`Storage target updated to: ${data.entity_name || data.storage_chat}`);
      }
    } catch (e: any) {
      alert(`Error updating storage target: ${e.message}`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!connected) {
      setShowAuthModal(true);
      return;
    }

    // Client-side file size check (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setUploadError("File size exceeds the 50MB limit. Please upload a smaller file.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('caption', uploadCaption);
    if (customUploadName.trim()) {
      formData.append('file_name', customUploadName.trim());
    }
    const targetWsId = uploadWorkspaceId || activeWorkspace?.id;
    if (targetWsId) {
      formData.append('workspace_id', String(targetWsId));
    }

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 400);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${res.status}`);
      }

      const result = await res.json();
      const directLink =
        result.direct_link ||
        (result.file_slug
          ? `${window.location.origin}/f/${result.file_slug}`
          : (result.file_url || `${window.location.origin}/api/download/${result.message_id}/${encodeURIComponent(result.file_name)}`));

      const enrichedResult = {
        ...result,
        direct_link: directLink,
      };

      setUploadProgress(100);
      setUploadResult(enrichedResult);
      setSelectedFile(null);
      setCustomUploadName('');
      setUploadCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchWorkspaces();
      fetchFiles();
      fetchStats();
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadError(err.message || 'File upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Bulk Upload Queue Management for Dedicated Upload Tab
  const addFilesToBulkQueue = (fileList: FileList | globalThis.File[]) => {
    const newItems: BulkUploadItem[] = Array.from(fileList).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'queued',
      progress: 0,
    }));
    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const removeBulkQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompletedBulkQueue = () => {
    setUploadQueue((prev) => prev.filter((item) => item.status !== 'completed'));
  };

  const clearAllBulkQueue = () => {
    if (isBulkUploading) return;
    setUploadQueue([]);
  };

  const retryBulkQueueItem = (id: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'queued', progress: 0, error: null } : item))
    );
  };

  const startBulkUploadProcess = async () => {
    if (!connected) {
      setShowAuthModal(true);
      return;
    }

    if (uploadQueue.length === 0) return;

    setIsBulkUploading(true);

    for (let i = 0; i < uploadQueue.length; i++) {
      const currentItem = uploadQueue[i];
      if (currentItem.status === 'completed') continue;

      setActiveUploadIndex(i);
      setUploadQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading', progress: 12, error: null } : item))
      );

      // 50MB check per file
      if (currentItem.file.size > 50 * 1024 * 1024) {
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', progress: 0, error: 'Exceeds 50MB limit' } : item
          )
        );
        continue;
      }

      let currentProgress = 12;
      const timer = setInterval(() => {
        currentProgress = Math.min(94, currentProgress + Math.floor(Math.random() * 4) + 2);
        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, progress: currentProgress } : item))
        );
      }, 120);

      const formData = new FormData();
      formData.append('file', currentItem.file);
      formData.append('file_name', currentItem.name);
      if (bulkUploadCaption.trim()) {
        formData.append('caption', bulkUploadCaption.trim());
      }
      if (bulkUploadPassword.trim()) {
        formData.append('password', bulkUploadPassword.trim());
      }
      const targetWsId = uploadWorkspaceId || activeWorkspace?.id;
      if (targetWsId) {
        formData.append('workspace_id', String(targetWsId));
      }

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(timer);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed (status ${res.status})`);
        }

        const result = await res.json();
        const directLink =
          result.direct_link ||
          (result.file_slug
            ? `${window.location.origin}/f/${result.file_slug}`
            : (result.file_url || `${window.location.origin}/api/download/${result.message_id}/${encodeURIComponent(result.file_name)}`));

        const enrichedResult = {
          ...result,
          direct_link: directLink,
        };

        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'completed', progress: 100, result: enrichedResult } : item
          )
        );

        fetchWorkspaces();
        fetchFiles();
        fetchStats();
      } catch (err: any) {
        clearInterval(timer);
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', progress: 0, error: err.message || 'Upload failed' } : item
          )
        );
      }
    }

    setIsBulkUploading(false);
    setActiveUploadIndex(-1);
  };

  const copyAllCompletedLinks = () => {
    const completedLinks = uploadQueue
      .filter((item) => item.status === 'completed' && item.result?.direct_link)
      .map((item) => item.result!.direct_link)
      .join('\n');

    if (!completedLinks) return;
    navigator.clipboard.writeText(completedLinks);
    setCopiedBatchAll(true);
    setTimeout(() => setCopiedBatchAll(false), 2500);
  };

  // Overview Drag & Drop Multiple File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverviewDragging(true);
  };

  const handleDragLeave = () => {
    setIsOverviewDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverviewDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToOverviewQueue(e.dataTransfer.files);
    }
  };

  const addFilesToOverviewQueue = (fileList: FileList | globalThis.File[]) => {
    const newItems: BulkUploadItem[] = Array.from(fileList).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'queued',
      progress: 0,
    }));
    setOverviewFiles((prev) => [...prev, ...newItems]);
  };

  const removeOverviewQueueItem = (id: string) => {
    setOverviewFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompletedOverviewQueue = () => {
    setOverviewFiles((prev) => prev.filter((item) => item.status !== 'completed'));
  };

  const clearAllOverviewQueue = () => {
    if (overviewUploading) return;
    setOverviewFiles([]);
  };

  const retryOverviewQueueItem = (id: string) => {
    setOverviewFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'queued', progress: 0, error: null } : item))
    );
  };

  const startOverviewBulkUpload = async () => {
    if (!connected) {
      setShowAuthModal(true);
      return;
    }

    if (overviewFiles.length === 0) return;

    setOverviewUploading(true);

    for (let i = 0; i < overviewFiles.length; i++) {
      const currentItem = overviewFiles[i];
      if (currentItem.status === 'completed') continue;

      setOverviewActiveIndex(i);
      setOverviewFiles((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading', progress: 15, error: null } : item))
      );

      if (currentItem.file.size > 50 * 1024 * 1024) {
        setOverviewFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', progress: 0, error: 'Exceeds 50MB limit' } : item
          )
        );
        continue;
      }

      let currentProgress = 15;
      const timer = setInterval(() => {
        currentProgress = Math.min(94, currentProgress + Math.floor(Math.random() * 4) + 2);
        setOverviewFiles((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, progress: currentProgress } : item))
        );
      }, 120);

      const formData = new FormData();
      formData.append('file', currentItem.file);
      formData.append('file_name', currentItem.name);
      if (overviewPassword.trim()) {
        formData.append('password', overviewPassword.trim());
      }
      const targetWsId = overviewWorkspaceId || activeWorkspace?.id;
      if (targetWsId) {
        formData.append('workspace_id', String(targetWsId));
      }

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(timer);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed (status ${res.status})`);
        }

        const result = await res.json();
        const directLink =
          result.direct_link ||
          (result.file_slug
            ? `${window.location.origin}/f/${result.file_slug}`
            : (result.file_url || `${window.location.origin}/api/download/${result.message_id}/${encodeURIComponent(result.file_name)}`));

        const enrichedResult = {
          ...result,
          direct_link: directLink,
        };

        setOverviewFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'completed', progress: 100, result: enrichedResult } : item
          )
        );

        fetchWorkspaces();
        fetchFiles();
        fetchStats();
      } catch (err: any) {
        clearInterval(timer);
        setOverviewFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', progress: 0, error: err.message || 'Upload failed' } : item
          )
        );
      }
    }

    setOverviewUploading(false);
    setOverviewActiveIndex(-1);
  };

  const copyAllCompletedOverviewLinks = () => {
    const completedLinks = overviewFiles
      .filter((item) => item.status === 'completed' && item.result?.direct_link)
      .map((item) => item.result!.direct_link)
      .join('\n');

    if (!completedLinks) return;
    navigator.clipboard.writeText(completedLinks);
    setOverviewCopiedBatchAll(true);
    setTimeout(() => setOverviewCopiedBatchAll(false), 2500);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile || !newFileNameInput.trim()) return;

    setRenamingLoading(true);
    try {
      const res = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user?.id,
          message_id: editingFile.message_id,
          new_file_name: newFileNameInput.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to rename file');
      }

      const updated = await res.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.message_id === editingFile.message_id
            ? { ...f, file_name: updated.file_name, direct_link: updated.direct_link }
            : f
        )
      );

      if (previewFile?.message_id === editingFile.message_id) {
        setPreviewFile((prev) =>
          prev ? { ...prev, file_name: updated.file_name, direct_link: updated.direct_link } : null
        );
      }

      setEditingFile(null);
      setNewFileNameInput('');
    } catch (err: any) {
      alert(`Error renaming file: ${err.message}`);
    } finally {
      setRenamingLoading(false);
    }
  };

  const handleDeleteFile = async (messageId: number) => {
    if (!confirm('Are you sure you want to remove this file from your Telegram vault and cloud catalog?')) return;
    try {
      const res = await fetch(`/api/files/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.message_id !== messageId));
        setSelectedFileIds((prev) => prev.filter((id) => id !== messageId));
        if (previewFile?.message_id === messageId) setPreviewFile(null);
        if (activeMediaStream?.message_id === messageId) setActiveMediaStream(null);
        fetchStats();
      } else {
        alert('Failed to delete file from Telegram chat storage.');
      }
    } catch (e: any) {
      alert(`Error deleting file: ${e.message}`);
    }
  };

  const toggleSelectFile = (id: number) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (filteredFiles.length === 0) return;
    const filteredIds = filteredFiles.map((f) => f.message_id);
    const allSelected = filteredIds.every((id) => selectedFileIds.includes(id));
    if (allSelected) {
      setSelectedFileIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedFileIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const clearSelection = () => {
    setSelectedFileIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedFileIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedFileIds.length} selected file(s) from your Telegram vault and cloud catalog?`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/files/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedFileIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const deletedSet = new Set((data.deleted_ids || selectedFileIds).map((id: any) => Number(id)));
        setFiles((prev) => prev.filter((f) => !deletedSet.has(f.message_id)));
        setSelectedFileIds([]);
        fetchStats();
      } else {
        alert(data.error || 'Failed to delete some files.');
      }
    } catch (err: any) {
      alert(`Bulk delete error: ${err.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleOpenManifest = async () => {
    if (selectedFileIds.length === 0) return;
    setLoadingManifest(true);
    setManifestModalOpen(true);
    try {
      const idsQuery = selectedFileIds.join(',');
      const res = await fetch(`/api/manifest?ids=${idsQuery}`);
      const data = await res.json();
      setManifestData(data);
    } catch (err: any) {
      console.error('Error generating manifest:', err);
    } finally {
      setLoadingManifest(false);
    }
  };

  const getFileShortId = (messageId: number | string): string => {
    const num = Number(messageId) || 0;
    let b36 = num.toString(36).toUpperCase();
    return b36;
  };

  const copyToClipboard = (text: string, id: string) => {
    let formattedText = text;
    // Intercept and convert standard download links to same domain with /f/ slug
    if (text && (text.includes('/api/download/') || text.includes('localhost') || text.includes('run.app') || text.includes('htknetwork'))) {
      const match = text.match(/\/api\/download\/([0-9]+)/);
      if (match && match[1]) {
        const shortId = getFileShortId(match[1]);
        formattedText = `${window.location.origin}/f/${shortId}`;
      } else if (text.startsWith('http') && !text.includes('/f/')) {
        // Fallback or generic convert if shortId is present as digits
        const numericId = text.replace(/[^0-9]/g, '');
        if (numericId && numericId.length >= 4) {
          formattedText = `${window.location.origin}/f/${getFileShortId(numericId)}`;
        }
      }
    }
    navigator.clipboard.writeText(formattedText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string = '', name: string = '') => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    if (mime.startsWith('video/')) return <Video className="w-5 h-5 text-indigo-500" />;
    if (mime.startsWith('audio/')) return <Music className="w-5 h-5 text-amber-500" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || name.endsWith('.gz') || name.endsWith('.7z'))
      return <Archive className="w-5 h-5 text-rose-500" />;
    if (mime.includes('pdf') || mime.includes('text') || mime.includes('document'))
      return <FileText className="w-5 h-5 text-sky-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const filteredFiles = files.filter((file) => {
    // Multi-Workspace Filter:
    // If vaultWorkspaceFilter is set to a specific workspace ID, filter strictly by that workspace.
    // If vaultWorkspaceFilter is 'all', display all files across all user workspaces.
    if (vaultWorkspaceFilter && vaultWorkspaceFilter !== 'all') {
      const matchesWs =
        String(file.workspace_id) === String(vaultWorkspaceFilter) ||
        (!file.workspace_id && workspaces.find((w) => String(w.id) === String(vaultWorkspaceFilter))?.is_default);
      if (!matchesWs) {
        return false;
      }
    }

    const matchesSearch = file.file_name.toLowerCase().includes(fileSearch.toLowerCase()) ||
      (file.caption && file.caption.toLowerCase().includes(fileSearch.toLowerCase())) ||
      (file.original_name && file.original_name.toLowerCase().includes(fileSearch.toLowerCase())) ||
      (file.workspace_name && file.workspace_name.toLowerCase().includes(fileSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (fileTypeFilter === 'all') return true;
    if (fileTypeFilter === 'images') return file.mime_type.startsWith('image/');
    if (fileTypeFilter === 'videos') return file.mime_type.startsWith('video/');
    if (fileTypeFilter === 'audio') return file.mime_type.startsWith('audio/');
    if (fileTypeFilter === 'documents') return file.mime_type.includes('pdf') || file.mime_type.includes('text') || file.mime_type.includes('doc');
    return true;
  });

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      if (fileSort === 'name_asc') {
        return (a.file_name || '').localeCompare(b.file_name || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      if (fileSort === 'name_desc') {
        return (b.file_name || '').localeCompare(a.file_name || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      if (fileSort === 'size_asc') {
        return (Number(a.file_size) || 0) - (Number(b.file_size) || 0);
      }
      if (fileSort === 'size_desc') {
        return (Number(b.file_size) || 0) - (Number(a.file_size) || 0);
      }
      if (fileSort === 'date_asc') {
        const timeA = new Date(a.created_at || a.date || 0).getTime() || Number(a.message_id) || 0;
        const timeB = new Date(b.created_at || b.date || 0).getTime() || Number(b.message_id) || 0;
        return timeA - timeB;
      }
      // 'date_desc' (default: newest first)
      const timeA = new Date(a.created_at || a.date || 0).getTime() || Number(a.message_id) || 0;
      const timeB = new Date(b.created_at || b.date || 0).getTime() || Number(b.message_id) || 0;
      return timeB - timeA;
    });
  }, [filteredFiles, fileSort]);

  const SORT_OPTIONS: { id: FileSortKey; label: string; field: 'name' | 'size' | 'date'; order: 'asc' | 'desc'; iconLabel: string }[] = [
    { id: 'date_desc', label: 'Upload Date (Newest first)', field: 'date', order: 'desc', iconLabel: 'Date: Newest' },
    { id: 'date_asc', label: 'Upload Date (Oldest first)', field: 'date', order: 'asc', iconLabel: 'Date: Oldest' },
    { id: 'name_asc', label: 'File Name (A → Z)', field: 'name', order: 'asc', iconLabel: 'Name: A → Z' },
    { id: 'name_desc', label: 'File Name (Z → A)', field: 'name', order: 'desc', iconLabel: 'Name: Z → A' },
    { id: 'size_desc', label: 'File Size (Largest first)', field: 'size', order: 'desc', iconLabel: 'Size: Largest' },
    { id: 'size_asc', label: 'File Size (Smallest first)', field: 'size', order: 'asc', iconLabel: 'Size: Smallest' },
  ];

  const currentSortObj = SORT_OPTIONS.find((s) => s.id === fileSort) || SORT_OPTIONS[0];

  const selectedFiles = files.filter((f) => selectedFileIds.includes(f.message_id));
  const selectedTotalBytes = selectedFiles.reduce((acc, f) => acc + (Number(f.file_size) || 0), 0);
  const allFilteredSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selectedFileIds.includes(f.message_id));
  const someFilteredSelected = filteredFiles.some((f) => selectedFileIds.includes(f.message_id)) && !allFilteredSelected;

  // ==========================================
  // INITIAL HANDSHAKE & SESSION VERIFICATION GATE
  // ==========================================
  if (loadingStatus) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans transition-colors duration-200 ${containerBg}`}>
        <div className="flex flex-col items-center space-y-4 p-8 rounded-3xl animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center shadow-xl shadow-sky-500/25">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="space-y-1 text-center">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
              TeleCloud
            </span>
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono pt-1">
              <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Verifying session handshake...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GLOBAL DATABASE HALT: If MySQL connection fails, directly show database error message and do NOT let application run at all
  if (!dbConnected) {
    return renderDatabaseErrorScreen();
  }

  // =========================================================================
  // APP LOCK (Web GUI Dashboard PIN Protection configured in .env)
  // If app is locked, block access to the entire web GUI dashboard
  // =========================================================================
  if (isAppLocked) {
    return renderAppLockScreen();
  }

  // =========================================================================
  // VIEW: DEDICATED /admin SYSTEM CONTROL PANEL (Protected by PIN 9890)
  // =========================================================================
  if (currentRoute === '/admin') {
    return (
      <AdminPanel
        onClose={() => { setDashboardTab('overview'); navigate('/'); }}
        onNavigateHome={() => { setDashboardTab('overview'); navigate('/'); }}
      />
    );
  }

  // ==========================================
  // VIEW A: LANDING PAGE (UNAUTHENTICATED)
  // ==========================================
  if (!connected && !webUser) {
    const handleSimulate = () => {
      setSimStep('uploading');
      setSimProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setSimProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setSimStep('indexing');
          setTimeout(() => {
            setSimStep('ready');
          }, 800);
        }
      }, 120);
    };

    const faqs = [
      {
        q: "How does the unlimited storage mechanism work?",
        a: "TeleCloud connects directly to Telegram's MTProto servers. Telegram permits unlimited file uploads within personal chats and private channels. TeleCloud operates as a highly optimized stream-indexer: it handles files, logs their byte maps to your personal MySQL database, and serves high-speed HTTP streams on demand."
      },
      {
        q: "How does TeleCloud handle high-speed streaming?",
        a: "When a user requests a file via our direct same-domain links, our optimized MTProto stream proxy handles the HTTP Range headers. It requests only the exact byte range requested by the browser from the Telegram MTProto engine. This means you can seek instantly through 4K videos or scrub large audio tracks with zero buffering."
      },
      {
        q: "Is my personal data securely encrypted?",
        a: "Absolutely. All communication between your browser, your VPS, and Telegram's data centers is fully encrypted using Telegram's enterprise-grade MTProto cryptosystem. TeleCloud never sees or stores your master credentials; you authenticate securely through native OTP or Bot tokens."
      }
    ];

    if (!dbConnected) {
      return renderDatabaseErrorScreen();
    }

    return (
      <div className={`min-h-screen flex flex-col font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden transition-colors duration-300 ${containerBg}`}>
        {/* Ambient background architectural grid & glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className={`absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full blur-[130px] ${darkMode ? 'bg-sky-950/25' : 'bg-sky-200/40'}`} />
          <div className={`absolute top-1/4 -right-32 w-[35rem] h-[35rem] rounded-full blur-[150px] ${darkMode ? 'bg-indigo-950/20' : 'bg-indigo-200/30'}`} />
        </div>

        {/* Top Navigation Bar - Responsive 3-Zone Contract with Full Slugs */}
        <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-200 ${darkMode ? 'bg-slate-950/90 border-slate-900 text-white shadow-md' : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-xs'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Zone 1: Single text wordmark & Logo */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl border transition ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-left focus:outline-none group"
              >
                {publicBranding.app_logo_url ? (
                  <img
                    src={publicBranding.app_logo_url}
                    alt={publicBranding.brand_name || 'Logo'}
                    className="h-8 max-w-[140px] object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-black text-xl tracking-tight bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent group-hover:opacity-90 transition">
                    {publicBranding.brand_name || 'TeleCloud'}
                  </span>
                )}
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-md">
                  {APP_VERSION}
                </span>
              </button>
            </div>

            {/* Zone 2: Navigation Links (All 6 Pages with Active States) */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-bold tracking-wide">
              {[
                { label: 'Home', path: '/' },
                { label: 'Features', path: '/features' },
                { label: 'Architecture & ROI', path: '/architecture' },
                { label: 'Streaming CDN', path: '/streaming-cdn' },
                { label: 'Security', path: '/security' },
                { label: 'Pricing ($0)', path: '/pricing' },
                { label: 'Contact', path: '/contact' },
              ].map((link) => {
                const isActive =
                  currentRoute === link.path ||
                  (link.path === '/architecture' && currentRoute === '/benefits') ||
                  (link.path === '/streaming-cdn' && currentRoute === '/streaming');
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                    }}
                    className={`transition-colors py-1 px-2.5 rounded-lg cursor-pointer ${
                      isActive
                        ? 'text-sky-500 font-extrabold bg-sky-500/10'
                        : darkMode
                        ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Primary Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLockApp}
                className={`p-2.5 rounded-xl border transition-colors flex items-center space-x-1.5 text-xs font-semibold cursor-pointer ${
                  darkMode
                    ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-950'
                }`}
                title="Lock Dashboard (Requires PIN set in .env to unlock)"
              >
                <Lock className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Lock</span>
              </button>

              <button
                onClick={toggleDarkMode}
                className={`p-2.5 rounded-xl border transition-colors ${
                  darkMode
                    ? 'bg-slate-900 text-amber-300 border-slate-800 hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>

              <button
                onClick={() => setShowAuthModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-bold text-xs shadow-lg transition duration-200 flex items-center space-x-2"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Vault</span>
                <span className="sm:hidden">Login</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown Menu */}
          {mobileMenuOpen && (
            <div className={`lg:hidden border-t px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200 ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-lg'
            }`}>
              {[
                { label: 'Home Overview', path: '/' },
                { label: 'Features Breakdown', path: '/features' },
                { label: 'Architecture & Benefits', path: '/architecture' },
                { label: 'Seekable Streaming CDN', path: '/streaming-cdn' },
                { label: 'Security & Cryptography', path: '/security' },
                { label: 'Pricing & TCO Comparison', path: '/pricing' },
                { label: 'Contact Support & Help Desk', path: '/contact' },
              ].map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    currentRoute === link.path
                      ? 'bg-sky-500 text-white'
                      : darkMode
                      ? 'text-slate-300 hover:bg-slate-900'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Main Marketing / Dedicated Pages Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 relative z-10">
          
          {/* Conditional Dedicated Page Router */}
          {currentRoute === '/features' && (
            <FeaturesPage
              darkMode={darkMode}
              onConnectClick={() => setShowAuthModal(true)}
              navigate={navigate}
            />
          )}

          {(currentRoute === '/benefits' || currentRoute === '/architecture') && (
            <BenefitsPage
              darkMode={darkMode}
              onConnectClick={() => setShowAuthModal(true)}
              navigate={navigate}
            />
          )}

          {(currentRoute === '/streaming-cdn' || currentRoute === '/streaming') && (
            <StreamingPage
              darkMode={darkMode}
              onConnectClick={() => setShowAuthModal(true)}
              navigate={navigate}
            />
          )}

          {currentRoute === '/security' && (
            <SecurityPage
              darkMode={darkMode}
              onConnectClick={() => setShowAuthModal(true)}
              navigate={navigate}
            />
          )}

          {currentRoute === '/pricing' && (
            <PricingPage
              darkMode={darkMode}
              onConnectClick={() => setShowAuthModal(true)}
              navigate={navigate}
            />
          )}

          {currentRoute === '/contact' && (
            <ContactPage
              darkMode={darkMode}
              onConnectClick={() => setShowAuthModal(true)}
              navigate={navigate}
            />
          )}

          {/* Default Route: Homepage Marketing Experience */}
          {currentRoute === '/' && (
            <div className="space-y-24">
              {/* Section 1: Hero & Real-Time MTProto Simulator Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Hero Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-500">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Turn Telegram into Your Personal Storage Cloud</span>
              </div>

              <h1 className={`text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-wrap-balance ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                Unlimited Cloud Storage.{' '}
                <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Powered by Telegram.
                </span>
              </h1>

              <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-800'} max-w-2xl`}>
                Connect your Telegram account, channel, or bot. Instantly turn your chats into an infinite, high-speed, self-hosted personal storage vault with zero file size caps, zero bandwidth limits, and complete data sovereignty on your own VPS.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 transition flex items-center justify-center space-x-3 group"
                >
                  <span>Access Personal Cloud</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#how-it-works"
                  className={`w-full sm:w-auto px-7 py-3.5 rounded-xl border font-bold text-sm transition text-center ${
                    darkMode
                      ? 'border-slate-800 hover:bg-slate-900 text-slate-300'
                      : 'border-slate-300 hover:bg-slate-150 text-slate-800 bg-white/50'
                  }`}
                >
                  Explore Mechanism
                </a>
              </div>

              {/* Unboxed Metadata Trust Badge */}
              <div className={`flex items-center gap-3 pt-2 text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Email/Passwords</span>
                <span>·</span>
                <span>Self-Hosted Database</span>
                <span>·</span>
                <span>Full Stream Range Seeking</span>
              </div>
            </div>

            {/* Right Column: Live Interactive MTProto Engine Simulator */}
            <div id="simulator" className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />
                
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">MTPROTO ENGINE SIMULATOR</span>
                </div>

                {/* Simulator Screen */}
                <div className="space-y-4 min-h-[220px] flex flex-col justify-between">
                  {simStep === 'idle' && (
                    <div className="text-center py-6 space-y-4 flex-1 flex flex-col justify-center items-center">
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/25 animate-bounce">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-white">Test the MTProto Streaming Pipeline</p>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">Click below to upload a simulated movie and see how the VPS indexes and streams it in real-time!</p>
                      </div>
                    </div>
                  )}

                  {simStep === 'uploading' && (
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin text-sky-400" /> Splitting file into encrypted blocks...</span>
                        <span>{simProgress}%</span>
                      </div>
                      {/* Visual Chunk Grid */}
                      <div className="grid grid-cols-10 gap-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-4 rounded-sm transition-all duration-300 ${
                              i * 5 < simProgress 
                                ? 'bg-gradient-to-br from-sky-400 to-indigo-600 shadow-xs shadow-sky-500/50' 
                                : 'bg-slate-800'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 text-center">Encrypting chunks with AES-256-IGE & pushing to MTProto stream channel</p>
                    </div>
                  )}

                  {simStep === 'indexing' && (
                    <div className="text-center py-6 space-y-4 flex-1 flex flex-col justify-center items-center">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/25 animate-pulse">
                        <Database className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-indigo-400">Writing to Local VPS MySQL...</p>
                        <p className="text-xs text-slate-400">Saving file name, mime type, byte mapping, and assigning static short index.</p>
                      </div>
                    </div>
                  )}

                  {simStep === 'ready' && (
                    <div className="space-y-4 flex-1 flex flex-col justify-center animate-fadeIn">
                      <div className="p-3 bg-slate-950/90 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Stream URL Ready!</p>
                            <p className="text-[10px] font-mono text-slate-500">{window.location.host}/f/6JGOTC</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                        <p className="text-[11px] font-mono text-slate-400 truncate">GET {window.location.origin}/f/6JGOTC</p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          HTTP/1.1 200 OK<br/>
                          Accept-Ranges: bytes<br/>
                          Content-Type: video/mp4<br/>
                          Content-Length: 1.48 GB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Simulator Trigger */}
                  <div className="pt-2">
                    {simStep === 'ready' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSimulate}
                          className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition active:scale-98"
                        >
                          Simulate Another
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/f/6JGOTC`);
                            alert("Copied simulated link to clipboard!");
                          }}
                          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-98"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSimulate}
                        disabled={simStep !== 'idle'}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                          simStep !== 'idle'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/10 active:scale-98'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start MTProto Simulation</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Core Capabilities (Numbered Service List) */}
          <div id="how-it-works" className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">The Mechanism</span>
              <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>How TeleCloud Streams Bytes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                A highly optimized direct connection between your private storage chats and your custom public domains.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4 text-left p-2 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-sky-500/30 dark:text-sky-400/20 font-mono">01.</span>
                </div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Secure Chunking & Handshake</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Upon uploading, the file is split into optimal MTProto-aligned memory blocks. These blocks are securely transmitted directly to your private Telegram cloud chat, bypassing local hard drive storage limits.
                </p>
              </div>

              <div className="space-y-4 text-left p-2 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Database className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-indigo-500/30 dark:text-indigo-400/20 font-mono">02.</span>
                </div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Relational DB Catalog Sync</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  The local VPS MySQL database logs the file's mime type, file name, message ID, and assigns a short Alphanumeric Base-36 ID. This keeps your library catalog lightning-fast and search-optimized.
                </p>
              </div>

              <div className="space-y-4 text-left p-2 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Radio className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-purple-500/30 dark:text-purple-400/20 font-mono">03.</span>
                </div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Nginx/PHP Range Streamer</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  When a direct link is accessed on TeleCloud, the server reads from MySQL, grabs the chunks on-the-fly, and proxies the stream with HTTP Range header support. You can seek and fast-forward instantly!
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Quantitative Proof Bento Grid */}
          <div id="features" className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">Unmatched Performance</span>
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-950'}`}>Storage Reimagined</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Marquee Box */}
              <div className={`md:col-span-8 p-8 rounded-3xl ${cardBg} flex flex-col justify-between space-y-6 text-left relative overflow-hidden`}>
                <div className="space-y-3 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                    <Zap className="w-5 h-5 fill-sky-200" />
                  </div>
                  <h3 className="text-xl font-bold">Zero Buffering Seek Latency</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-normal">
                    Through on-the-fly range chunk proxying, TeleCloud skips waiting for entire large videos or audio files to download. It fetches only the active bytes being played by your viewer.
                  </p>
                </div>
                
                <div className="flex gap-8 border-t border-slate-200/50 dark:border-slate-800/60 pt-4 relative z-10">
                  <div>
                    <p className={`text-3xl font-black font-mono tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>0ms</p>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Connection Handshake</p>
                  </div>
                  <div>
                    <p className={`text-3xl font-black font-mono tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>100%</p>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">HTML5 Range Compliant</p>
                  </div>
                </div>
              </div>

              {/* Box 2 */}
              <div className={`md:col-span-4 p-8 rounded-3xl ${cardBg} flex flex-col justify-between text-left`}>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Lock className="w-5 h-5 fill-indigo-200" />
                  </div>
                  <h3 className="text-lg font-bold">Encrypted Handshake</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Native MTProto layer encryption ensures that only authorized clients authenticated through secure sessions can upload or stream documents from your vault.
                  </p>
                </div>
                <div className="text-xs font-mono text-indigo-400 font-bold pt-4">AES-256-IGE Encrypted</div>
              </div>

              {/* Box 3 */}
              <div className={`md:col-span-4 p-8 rounded-3xl ${cardBg} flex flex-col justify-between text-left`}>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Layers className="w-5 h-5 fill-purple-200" />
                  </div>
                  <h3 className="text-lg font-bold">Workspace Isolation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Create independent sandboxes to organize files. Map distinct Telegram groups or storage channels to separate project directories securely.
                  </p>
                </div>
                <div className="text-xs font-mono text-purple-400 font-bold pt-4">Multi-Workspace Ready</div>
              </div>

              {/* Box 4 - Big Stat */}
              <div className={`md:col-span-8 p-8 rounded-3xl ${cardBg} flex flex-col justify-between text-left relative overflow-hidden`}>
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">No Bandwidth Penalties</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Since data packets flow on-the-fly through your private VPS memory stream directly from Telegram cloud nodes, you pay absolutely $0 for external storage space or download bandwidth caps.
                  </p>
                </div>
                <div className="flex items-baseline gap-2 pt-6">
                  <span className={`text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>$0.00</span>
                  <span className="text-xs text-slate-400 font-medium">/ GB storage and streaming fees</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Interactive Accordion FAQs */}
          <div id="faq" className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Support Catalog</span>
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-950'} font-display`}>Frequently Answered Queries</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div 
                    key={index} 
                    className={`rounded-2xl transition-all duration-200 border ${
                      isOpen 
                        ? 'bg-slate-50 dark:bg-slate-900 border-sky-500/20' 
                        : 'border-slate-200/60 dark:border-slate-900/80 hover:border-slate-300 dark:hover:border-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                    >
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/40 dark:border-slate-800/40 animate-slideDown">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Bottom Final Call to Action */}
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Own Your Cloud?</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-normal">
              Establish a secure decentralized gateway, register a database, and configure your streaming vault on port 3000 in minutes.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="mx-auto px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-xl shadow-sky-500/20 transition flex items-center justify-center space-x-2 active:scale-95"
              >
                <Smartphone className="w-5 h-5" />
                <span>Launch TeleCloud Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

        </main>

        {/* Quiet Footer with Working Slugs */}
        <footer className={`border-t py-12 transition-colors duration-200 ${darkMode ? 'bg-slate-950/80 border-slate-900' : 'bg-slate-50 border-slate-200/80'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/')} className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">TeleCloud</span>
                </button>
                <span className="text-xs text-slate-400">© {new Date().getFullYear()} • Decentralized MTProto Cloud Systems</span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <button onClick={() => navigate('/features')} className="hover:text-sky-500 transition">Features</button>
                <button onClick={() => navigate('/architecture')} className="hover:text-sky-500 transition">Architecture & ROI</button>
                <button onClick={() => navigate('/streaming-cdn')} className="hover:text-sky-500 transition">Streaming CDN</button>
                <button onClick={() => navigate('/security')} className="hover:text-sky-500 transition">Security</button>
                <button onClick={() => navigate('/pricing')} className="hover:text-sky-500 transition">Pricing ($0)</button>
                <button onClick={() => navigate('/contact')} className="hover:text-sky-500 transition">Contact Desk</button>
              </div>
            </div>
          </div>
        </footer>

        {/* Telegram Auth Modal */}
        {renderAuthModal()}
      </div>
    );
  }

  // ==========================================
  // VIEW B: DEDICATED LOGGED-IN CLOUD DASHBOARD
  // WITH LIQUID GLASS SIDEBAR & TOP HEADER
  // ==========================================
  return (
    <div className={`h-screen flex flex-col font-sans selection:bg-sky-500 selection:text-white relative overflow-hidden transition-colors duration-200 ${containerBg}`}>
      
      {/* Ambient liquid orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[100px] ${darkMode ? 'bg-gradient-to-tr from-sky-950/40 to-indigo-950/30' : 'bg-gradient-to-tr from-sky-200/50 to-indigo-200/40'}`} />
        <div className={`absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full blur-[120px] ${darkMode ? 'bg-gradient-to-bl from-indigo-950/30 via-sky-950/20 to-teal-950/20' : 'bg-gradient-to-bl from-indigo-200/40 via-sky-100/50 to-teal-100/40'}`} />
        <div className={`absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] rounded-full blur-[100px] ${darkMode ? 'bg-gradient-to-tr from-cyan-950/30 to-sky-950/30' : 'bg-gradient-to-tr from-cyan-100/60 to-sky-200/40'}`} />
      </div>

      {/* TOP DASHBOARD HEADER - Command Center with Dark/Light Theme Support */}
      <header className={`sticky top-0 z-40 border-b h-16 flex items-center justify-between px-2.5 sm:px-6 transition-colors duration-200 ${headerBg}`}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className={`md:hidden p-2 rounded-xl border transition shadow-2xs ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2">
            {publicBranding.app_logo_url ? (
              <img
                src={publicBranding.app_logo_url}
                alt={publicBranding.brand_name || 'Logo'}
                className="h-8 max-w-[120px] object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-sky-500/20 ring-2 flex-shrink-0 ${
                darkMode ? 'ring-slate-700' : 'ring-sky-100'
              }`}>
                <Radio className="w-4 h-4 text-white animate-pulse" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className={`font-extrabold text-sm sm:text-base tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {publicBranding.brand_name || 'TeleCloud'}
                </span>
                {/* Header Version Number */}
                <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold rounded-full shadow-2xs backdrop-blur-sm ${
                  darkMode ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' : 'bg-sky-50 text-sky-700 border border-sky-200/80'
                }`}>
                  {APP_VERSION}
                </span>

                {/* Interactive Multi-Workspace Switcher Dropdown */}
                <div className="relative" ref={workspaceDropdownRef}>
                  <button
                    onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
                    className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-xl border transition shadow-2xs active:scale-95 ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 border-slate-200'
                    }`}
                    title="Switch Workspace connected to your Telegram account"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <span className={`font-bold max-w-[70px] sm:max-w-[130px] truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {activeWorkspace?.name || 'Default Workspace'}
                    </span>
                    <span className={`hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold rounded border ${
                      darkMode ? 'bg-sky-500/20 text-sky-300 border-sky-400/30' : 'bg-sky-100/80 text-sky-700 border-sky-200'
                    }`}>
                      ID #{activeWorkspace?.id || 1}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  </button>

                  {workspaceDropdownOpen && (
                    <div className={`absolute left-0 sm:left-auto right-auto mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm rounded-2xl shadow-2xl z-50 p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl border ${dropdownBg}`}>
                      <div className={`px-2.5 py-1.5 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Telegram Account: #{user?.id}
                          </p>
                          <p className="text-[11px] text-sky-400 font-semibold">
                            Connected MySQL Workspaces ({workspaces.length})
                          </p>
                        </div>
                        <button
                          onClick={() => setWorkspaceDropdownOpen(false)}
                          className={`p-1 text-slate-400 rounded-lg transition ${darkMode ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-800 hover:bg-slate-100'}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                        {workspaces.map((ws) => {
                          const isActive = ws.id === activeWorkspaceId;
                          return (
                            <div
                              key={ws.id}
                              className={`w-full p-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                isActive
                                  ? (darkMode ? 'bg-sky-500/10 text-sky-200 border border-sky-500/30' : 'bg-sky-50 text-sky-900 border border-sky-100')
                                  : (darkMode ? 'text-slate-300 hover:bg-slate-800/40 border border-transparent' : 'text-slate-700 hover:bg-slate-50 border border-transparent')
                              }`}
                            >
                              <div
                                onClick={() => {
                                  handleSwitchWorkspace(ws.id);
                                  setWorkspaceDropdownOpen(false);
                                }}
                                className="flex-1 min-w-0 cursor-pointer pr-2"
                              >
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className={`font-extrabold text-xs truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ws.name}</span>
                                  <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded border ${
                                    darkMode ? 'bg-sky-500/20 text-sky-300 border-sky-400/30' : 'bg-sky-100 text-sky-700 border-sky-200'
                                  }`}>
                                    ID #{ws.id}
                                  </span>
                                  {ws.is_default && (
                                    <span className={`px-1.5 py-0.2 text-[9px] rounded border font-medium ${
                                      darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>Default</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                  Target: {ws.storage_chat === 'me' ? 'Self (Saved Messages)' : ws.storage_chat}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {ws.file_count || 0} f
                                </span>
                                {isActive && (
                                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                                )}
                                <button
                                  type="button"
                                  disabled={workspaces.length <= 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWorkspace(ws.id, ws.name);
                                  }}
                                  className={`p-1 rounded-lg transition ${
                                    workspaces.length <= 1
                                      ? 'opacity-30 cursor-not-allowed text-slate-500'
                                      : 'text-rose-400 hover:text-rose-500 hover:bg-rose-500/10'
                                  }`}
                                  title="Delete workspace and all associated files"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className={`pt-2 border-t flex items-center gap-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <button
                          onClick={() => {
                            setWorkspaceDropdownOpen(false);
                            setCreateWorkspaceModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs text-center shadow-xs transition"
                        >
                          + Create New
                        </button>
                        <button
                          onClick={() => {
                            setWorkspaceDropdownOpen(false);
                            setDashboardTab('settings');
                          }}
                          className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                            darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Manage Workspace
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="telecloud_vault_global_search"
              id="telecloud_vault_global_search"
              value={fileSearch}
              onChange={(e) => {
                setFileSearch(e.target.value);
                if (dashboardTab !== 'vault') setDashboardTab('vault');
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              data-form-type="other"
              placeholder="Search cloud files, documents, videos..."
              className={`w-full rounded-2xl pl-9 pr-4 py-2 text-xs transition ${inputBg}`}
            />
          </div>
        </div>

        {/* Right Header Status Badges & Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Dashboard Lock Button */}
          <button
            onClick={handleLockApp}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition text-xs font-bold cursor-pointer ${
              darkMode
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white shadow-xs'
                : 'bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900 shadow-2xs'
            }`}
            title="Lock Dashboard (Requires PIN set in .env to unlock)"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="hidden sm:inline">Lock</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition text-xs font-bold ${
              darkMode
                ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700 shadow-xs'
                : 'bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/80 shadow-2xs'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
          </button>

          {/* Visual Storage Chat Quick Toggle (Saved Messages vs Custom Channel) */}
          <div className={`hidden sm:flex items-center rounded-xl p-0.5 border text-xs ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => selectStorageDestination('me', 'Saved Messages')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                storageChat === 'me'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
              title="Store uploaded files in your private Telegram Saved Messages"
            >
              Saved Messages
            </button>
            <button
              type="button"
              onClick={() => setDashboardTab('settings')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 ${
                storageChat !== 'me'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
              title="Store uploaded files in a Custom Telegram Channel"
            >
              <span>{storageChat !== 'me' ? `Channel (${storageChat})` : 'Custom Channel'}</span>
            </button>
          </div>

          {/* Quick Upload Button */}
          <button
            onClick={() => setDashboardTab('upload')}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition active:scale-95"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Upload</span>
          </button>

          {/* User Profile & Web Account Pill */}
          {(user || webUser) && (
            <div className={`flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-2 border-l ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                {user?.first_name ? user.first_name[0].toUpperCase() : (webUser?.username ? webUser.username[0].toUpperCase() : 'U')}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className={`font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {user ? `${user.first_name} ${user.last_name || ''}`.trim() : webUser?.username}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {webUser ? `Account: @${webUser.username}` : `@${user?.username || user?.id}`}
                </p>
              </div>
              {connected ? (
                <button
                  onClick={handleOpenExportModal}
                  title="Backup / Download Session File (.telecloud) for instant login without OTP/QR"
                  className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                    darkMode
                      ? 'bg-amber-950/30 hover:bg-amber-950/60 border-amber-800/60 text-amber-300'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                  }`}
                >
                  <FileKey className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden lg:inline text-[11px]">Backup Key</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAuthMode('phone'); setShowAuthModal(true); }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] transition cursor-pointer flex items-center space-x-1 shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Link Telegram</span>
                </button>
              )}
              <button
                onClick={webUser ? handleWebLogout : handleDisconnect}
                title={webUser ? "Sign out of Web Account" : "Disconnect Telegram"}
                className={`p-1 sm:p-1.5 rounded-xl transition cursor-pointer ${darkMode ? 'hover:bg-rose-950/60 text-slate-400 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* DASHBOARD BODY (SIDEBAR + MAIN CONTENT) */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative z-10 overflow-hidden">
        
        {/* Mobile Sidebar Overlay Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-25 md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close mobile navigation"
          />
        )}
        
        {/* SIDEBAR WITH DARK & LIGHT MODE SUPPORT */}
        <aside
          className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r shadow-xs flex flex-col justify-between p-4 transition-transform duration-200 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${sidebarBg}`}
        >
          {/* Sidebar Menu Items */}
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Storage Cloud
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setDashboardTab('overview'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition border-b border-dashed cursor-pointer ${
                    darkMode ? 'border-slate-800/40' : 'border-slate-100'
                  } ${
                    dashboardTab === 'overview'
                      ? (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700')
                      : (darkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 text-indigo-400 shrink-0`} />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDashboardTab('upload'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition border-b border-dashed cursor-pointer ${
                    darkMode ? 'border-slate-800/40' : 'border-slate-100'
                  } ${
                    dashboardTab === 'upload'
                      ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                      : (darkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  <UploadCloud className={`w-4 h-4 text-emerald-400 shrink-0`} />
                  <span>Upload & Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDashboardTab('vault'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition border-b border-dashed cursor-pointer ${
                    darkMode ? 'border-slate-800/40' : 'border-slate-100'
                  } ${
                    dashboardTab === 'vault'
                      ? (darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700')
                      : (darkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <HardDrive className={`w-4 h-4 text-purple-400 shrink-0`} />
                    <span>Files Vault</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded-md font-mono font-bold ${
                    dashboardTab === 'vault'
                      ? (darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800')
                      : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                  }`}>
                    {activeWorkspaceFileCount} files
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDashboardTab('analytics'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition border-b border-dashed cursor-pointer ${
                    darkMode ? 'border-slate-800/40' : 'border-slate-100'
                  } ${
                    dashboardTab === 'analytics'
                      ? (darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700')
                      : (darkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Activity className={`w-4 h-4 text-amber-400 shrink-0`} />
                    <span>Analytics & Cleanup</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Auto
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDashboardTab('streamer'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition border-b border-dashed cursor-pointer ${
                    darkMode ? 'border-slate-800/40' : 'border-slate-100'
                  } ${
                    dashboardTab === 'streamer'
                      ? (darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-700')
                      : (darkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  <Film className={`w-4 h-4 text-rose-400 shrink-0`} />
                  <span>Media Streamer</span>
                </button>
              </div>
            </div>

            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Developer & Settings
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setDashboardTab('api'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition border-b border-dashed cursor-pointer ${
                    darkMode ? 'border-slate-800/40' : 'border-slate-100'
                  } ${
                    dashboardTab === 'api'
                      ? (darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700')
                      : (darkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Terminal className={`w-4 h-4 text-cyan-400 shrink-0`} />
                    <span>API & Postman</span>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-bold ${
                    dashboardTab === 'api'
                      ? (darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800')
                      : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                  }`}>
                    REST
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDashboardTab('settings'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition border-b border-dashed cursor-pointer ${
                    darkMode ? 'border-slate-800/40' : 'border-slate-100'
                  } ${
                    dashboardTab === 'settings'
                      ? (darkMode ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-700')
                      : (darkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  <Sliders className={`w-4 h-4 text-pink-400 shrink-0`} />
                  <span>Storage Destination</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Footer with Active Workspace Details & Storage Meter */}
          <div className={`pt-4 border-t space-y-3 ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
            <div className={`p-3 rounded-2xl border space-y-2.5 ${subCardBg}`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active Workspace</span>
                </span>
                <span className="text-sky-400 font-mono font-bold">{activeWorkspaceFileCount} files</span>
              </div>
              
              <div className="flex items-center justify-between text-[10px]">
                <span className={`truncate font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {activeWorkspace?.name || 'Default Workspace'}
                </span>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${darkMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                  ID #{activeWorkspace?.id || 1}
                </span>
              </div>

              <div className={`w-full rounded-full h-1.5 overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200/80'}`}>
                <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-1.5 w-1/3 rounded-full" />
              </div>
              
              <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} flex items-center justify-between font-medium`}>
                <span>Size: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{formatBytes(activeWorkspaceBytes)}</strong></span>
                <span>Total: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{formatBytes(stats?.totalBytes || 0)}</strong></span>
              </div>
            </div>

            <div className="space-y-1.5 px-1 py-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Switch Workspace</span>
                <button 
                  onClick={() => setCreateWorkspaceModalOpen(true)}
                  className="text-[10px] font-extrabold text-sky-500 hover:text-sky-400 flex items-center gap-0.5"
                >
                  + Create New
                </button>
              </div>
              <select
                value={activeWorkspaceId || ''}
                onChange={(e) => {
                  const wsId = e.target.value;
                  if (wsId) {
                    handleSwitchWorkspace(Number(wsId));
                  }
                }}
                className={`w-full text-xs px-2.5 py-1.5 rounded-xl transition ${inputBg} font-bold`}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.file_count || 0} files)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto min-w-0 pb-24 md:pb-8 space-y-4">
          
          {/* Telegram Account Link / Reconnect Alert Banner */}
          {(connectivityLost || !connected) && (
            <div className={`p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-xl backdrop-blur-xl ${
              darkMode 
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-200' 
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}>
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  darkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'
                }`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-black flex items-center gap-2 ${
                    darkMode ? 'text-sky-300' : 'text-sky-800'
                  }`}>
                    <span>{connectivityLost ? 'Telegram connectivity lost' : 'Connect Your Personal Telegram Account'}</span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                      darkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-200/60 text-sky-800'
                    }`}>Step 2 of 2</span>
                  </h4>
                  <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${
                    darkMode ? 'text-sky-200/95' : 'text-sky-950/85'
                  }`}>
                    {connectivityLost
                      ? 'Your Telegram session expired or was disconnected. Click below to reconnect your personal Telegram account.'
                      : 'Link your personal Telegram account via Phone Number & OTP to unlock your isolated unlimited cloud storage space.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setAuthMode('phone'); setShowAuthModal(true); }}
                className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition active:scale-95 shrink-0 flex items-center justify-center space-x-2 cursor-pointer ${
                  darkMode ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/10'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{connectivityLost ? 'Reconnect Telegram' : 'Connect Telegram (Phone OTP)'}</span>
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & STATS */}
          {dashboardTab === 'overview' && (
            <div className="space-y-6 font-sans">
              {/* Welcome Header */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl transition-colors duration-200 ${cardBg}`}>
                <div>
                  <h1 className={`text-lg sm:text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Welcome back, {user?.first_name}!
                  </h1>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Your personal cloud storage is active and linked to account: <span className={`font-mono font-bold ${darkMode ? 'text-sky-300' : 'text-slate-800'}`}>@{user?.username || user?.id}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDashboardTab('upload')}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-[11px] shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition flex items-center space-x-1.5 active:scale-95"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Detailed Upload Options</span>
                  </button>
                </div>
              </div>

              {/* Drag-and-Drop Direct Link Generator Card (Bulk & Single) */}
              <div className={`p-4 sm:p-5 rounded-2xl space-y-4 transition-colors duration-200 ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={`font-black text-sm sm:text-base flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <UploadCloud className="w-5 h-5 text-sky-500" />
                      <span>Bulk Drag & Drop Storage Uploader</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Drop single or multiple files to stream directly to Telegram MTProto and generate instant CDN links.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-sky-500 uppercase tracking-widest bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20 shadow-2xs">
                      Max 50MB / File
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left drag zone / multi-file queue */}
                  <div className="lg:col-span-7 flex flex-col space-y-3">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => overviewFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[160px] ${
                        isOverviewDragging
                          ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10 scale-[1.01]'
                          : overviewFiles.length > 0
                          ? 'border-sky-500/40 bg-sky-500/5'
                          : 'border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500/40 bg-slate-50/50 dark:bg-slate-950/30'
                      }`}
                    >
                      <input
                        type="file"
                        ref={overviewFileInputRef}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            addFilesToOverviewQueue(e.target.files);
                            if (e.target) e.target.value = '';
                          }
                        }}
                      />
                      
                      <div className="space-y-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20 shadow-sm animate-pulse-glow">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            Drop <span className="text-sky-500 underline font-extrabold">multiple files</span> here, or click to browse
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Videos, Photos, Archives (.zip), Documents, APKs • Up to 50MB each
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Queued files display */}
                    {overviewFiles.length > 0 && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className={`font-mono font-bold text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Queue: {overviewFiles.length} {overviewFiles.length === 1 ? 'file' : 'files'} ({formatBytes(overviewFiles.reduce((acc, f) => acc + f.size, 0))})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                overviewFileInputRef.current?.click();
                              }}
                              disabled={overviewUploading}
                              className="text-[10px] font-bold text-sky-500 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" /> Add More
                            </button>
                            {overviewFiles.some((f) => f.status === 'completed') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearCompletedOverviewQueue();
                                }}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-300 hover:underline cursor-pointer"
                              >
                                Clear Completed
                              </button>
                            )}
                            {!overviewUploading && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearAllOverviewQueue();
                                }}
                                className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                              >
                                Reset All
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Overall batch progress bar if uploading */}
                        {overviewUploading && (
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 font-bold">
                              <span className="flex items-center gap-1.5 text-sky-400">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Uploading {overviewActiveIndex + 1} of {overviewFiles.length}...</span>
                              </span>
                              <span>
                                {Math.round(
                                  (overviewFiles.reduce((acc, f) => acc + (f.status === 'completed' ? 100 : f.status === 'uploading' ? f.progress : 0), 0) /
                                    (overviewFiles.length * 100)) * 100
                                )}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300 relative overflow-hidden"
                                style={{
                                  width: `${Math.round(
                                    (overviewFiles.reduce((acc, f) => acc + (f.status === 'completed' ? 100 : f.status === 'uploading' ? f.progress : 0), 0) /
                                      (overviewFiles.length * 100)) * 100
                                  )}%`
                                }}
                              >
                                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* File Item List */}
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                          {overviewFiles.map((item, idx) => (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-2.5 ${
                                item.status === 'uploading'
                                  ? 'bg-sky-500/10 border-sky-500/40 shadow-sm'
                                  : item.status === 'completed'
                                  ? 'bg-emerald-500/5 border-emerald-500/30'
                                  : item.status === 'error'
                                  ? 'bg-rose-500/10 border-rose-500/30'
                                  : darkMode
                                  ? 'bg-slate-950/60 border-slate-800'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  item.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : darkMode
                                    ? 'bg-slate-900 text-sky-400'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {item.status === 'completed' ? (
                                    <Check className="w-4 h-4 animate-checkmark-pop" />
                                  ) : (
                                    getFileIcon(item.type, item.name)
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`} title={item.name}>
                                    {item.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                                    <span>{formatBytes(item.size)}</span>
                                    <span>•</span>
                                    {item.status === 'queued' && <span className="text-slate-400 font-medium">Ready in queue</span>}
                                    {item.status === 'uploading' && (
                                      <span className="text-sky-400 font-bold flex items-center gap-1">
                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Streaming {item.progress}%
                                      </span>
                                    )}
                                    {item.status === 'completed' && <span className="text-emerald-400 font-bold">Uploaded</span>}
                                    {item.status === 'error' && <span className="text-rose-400 font-bold">{item.error || 'Failed'}</span>}
                                  </div>

                                  {/* Item progress bar when active */}
                                  {item.status === 'uploading' && (
                                    <div className="w-full bg-slate-900 rounded-full h-1 mt-1.5 overflow-hidden">
                                      <div
                                        className="bg-gradient-to-r from-sky-400 to-indigo-500 h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${item.progress}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                {item.status === 'completed' && item.result?.direct_link && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(item.result!.direct_link!, `overview-${item.id}`)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      copiedId === `overview-${item.id}`
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                                    }`}
                                  >
                                    {copiedId === `overview-${item.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedId === `overview-${item.id}` ? 'Copied' : 'Link'}</span>
                                  </button>
                                )}

                                {item.status === 'error' && (
                                  <button
                                    type="button"
                                    onClick={() => retryOverviewQueueItem(item.id)}
                                    className="p-1 text-xs text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-0.5 cursor-pointer"
                                    title="Retry this file"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}

                                {item.status !== 'uploading' && (
                                  <button
                                    type="button"
                                    onClick={() => removeOverviewQueueItem(item.id)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                    title="Remove file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right configuration & action zone */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3 flex-1">
                      {/* Password Protection */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-sky-500" />
                          <span>Batch Password Protection</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Leave blank for no password"
                          value={overviewPassword}
                          onChange={(e) => setOverviewPassword(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs transition ${inputBg} font-semibold`}
                        />
                        <p className="text-[10px] text-slate-400">
                          Applied to all files uploaded in this batch.
                        </p>
                      </div>

                      {/* Completed summary & Copy All */}
                      {overviewFiles.some((f) => f.status === 'completed') && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{overviewFiles.filter((f) => f.status === 'completed').length} files uploaded!</span>
                            </span>
                            <button
                              type="button"
                              onClick={copyAllCompletedOverviewLinks}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                overviewCopiedBatchAll
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                              }`}
                            >
                              {overviewCopiedBatchAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{overviewCopiedBatchAll ? 'All Copied!' : 'Copy All Links'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div>
                      {overviewUploading ? (
                        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-center space-y-1">
                          <p className="text-xs font-bold text-sky-400 flex items-center justify-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Bulk Queue...</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Auto-syncing to MTProto & MySQL
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={startOverviewBulkUpload}
                            disabled={overviewFiles.length === 0 || !overviewFiles.some((f) => f.status === 'queued' || f.status === 'error')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                              overviewFiles.length > 0 && overviewFiles.some((f) => f.status === 'queued' || f.status === 'error')
                                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 active:scale-98 cursor-pointer'
                                : darkMode
                                ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>
                              {overviewFiles.length === 0
                                ? 'Select Files to Upload'
                                : `Upload ${overviewFiles.filter((f) => f.status === 'queued' || f.status === 'error').length} Files`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Cloud Files</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                      <HardDrive className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black font-mono tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {stats?.totalFiles || files.length}
                  </p>
                  <p className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Indexed & Streamable</span>
                  </p>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cloud Storage Used</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black font-mono tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatBytes(stats?.totalBytes || 0)}
                  </p>
                  <p className={`text-[11px] font-medium mt-1 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                    Encrypted MTProto Storage
                  </p>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CDN Stream Health</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Online & Ready
                  </p>
                  <p className="text-[11px] text-emerald-500 font-medium mt-1">
                    Byte-range streaming active
                  </p>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Storage Target</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                      <Radio className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-base font-bold font-mono truncate ${darkMode ? 'text-white' : 'text-slate-900'}`} title={storageChat === 'me' ? 'Self (Saved Messages)' : storageChat}>
                    {storageChat === 'me' ? 'Saved Messages' : storageChat}
                  </p>
                  <button onClick={() => setDashboardTab('settings')} className="text-[11px] text-sky-500 font-semibold hover:underline mt-1 text-left block">
                    Change destination →
                  </button>
                </div>
              </div>

              {/* Breakdown by Type & Recent Uploads */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Breakdown */}
                <div className={`p-4 sm:p-5 rounded-2xl space-y-4 transition-colors duration-200 ${cardBg}`}>
                  <h3 className={`font-bold text-sm flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Layers className="w-4 h-4 text-sky-500" />
                    <span>File Categories</span>
                  </h3>

                  <div className="space-y-2">
                    {[
                      { key: 'videos', label: 'Videos', icon: Video, color: 'text-indigo-400' },
                      { key: 'images', label: 'Images', icon: ImageIcon, color: 'text-emerald-400' },
                      { key: 'documents', label: 'Documents', icon: FileText, color: 'text-sky-400' },
                      { key: 'audio', label: 'Audio', icon: Music, color: 'text-amber-400' },
                      { key: 'archives', label: 'Archives', icon: Archive, color: 'text-rose-400' },
                    ].map(({ key, label, icon: Icon, color }) => {
                      const count = stats?.breakdown?.[key]?.count || 0;
                      const bytes = stats?.breakdown?.[key]?.bytes || 0;
                      return (
                        <div key={key} className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors duration-200 ${subCardBg}`}>
                          <div className="flex items-center space-x-2.5">
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{label}</span>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{count}</span>
                            <span className={`ml-1.5 text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({formatBytes(bytes)})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Uploads Table */}
                <div className={`lg:col-span-2 p-4 sm:p-5 rounded-2xl space-y-4 transition-colors duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-extrabold text-sm flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <HardDrive className="w-4 h-4 text-sky-500" />
                      <span>Recent Files</span>
                    </h3>
                    <button
                      onClick={() => setDashboardTab('vault')}
                      className="text-xs text-sky-400 font-bold hover:underline"
                    >
                      View All in Vault →
                    </button>
                  </div>

                  {files.length === 0 ? (
                    <div className={`p-8 text-center text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      No files uploaded yet. Upload your first file to get started!
                    </div>
                  ) : (
                    <div className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {files.slice(0, 5).map((f) => (
                        <div key={f.message_id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 max-w-xs sm:max-w-md">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              darkMode ? 'bg-slate-950 border border-slate-800 text-sky-400' : 'bg-white shadow-xs border border-slate-200'
                            }`}>
                              {getFileIcon(f.mime_type, f.file_name)}
                            </div>
                            <div className="truncate">
                              <p className={`font-bold text-xs truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{f.file_name}</p>
                              <p className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatBytes(f.file_size)}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(f.direct_link || '', `rec-${f.message_id}`)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center space-x-1 ${
                                darkMode ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80 hover:bg-sky-900' : 'bg-sky-50 text-sky-600 border border-sky-200/80 hover:bg-sky-100'
                              }`}
                            >
                              {copiedId === `rec-${f.message_id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === `rec-${f.message_id}` ? 'Copied' : 'Link'}</span>
                            </button>
                            <a
                              href={f.direct_link}
                              target="_blank"
                              rel="noreferrer"
                              className={`p-1.5 rounded-xl transition ${
                                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-WORKSPACE MANAGEMENT */}
          {dashboardTab === 'workspaces' && (
            <div className="space-y-6">
              {/* Header card with Architecture Details */}
              <div className={`p-6 sm:p-7 rounded-3xl space-y-4 transition-colors duration-200 ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h2 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Multi-Workspace Management
                      </h2>
                    </div>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      One Telegram Account linked to multiple persistent workspaces in MySQL with independent storage settings.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setNewWorkspaceName('');
                      setNewWorkspaceStorageChat('me');
                      setCreateWorkspaceModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center space-x-1.5 transition active:scale-95"
                  >
                    <span>+ Create New Workspace</span>
                  </button>
                </div>

                {/* Architecture Visual Explainer Box */}
                <div className={`p-4 rounded-2xl space-y-3 transition-colors duration-200 ${subCardBg}`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        Telegram Account: <span className="font-mono text-sky-400 font-extrabold">#{user?.id}</span> ({user?.first_name})
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      MySQL Database Architecture
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className={`p-3 rounded-xl space-y-1 ${darkMode ? 'bg-slate-900/80 border border-slate-800' : 'bg-white border border-slate-200/80 shadow-2xs'}`}>
                      <p className={`text-xs font-extrabold flex items-center space-x-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <span>Unified Telegram Storage</span>
                      </p>
                      <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        All files are stored in your Telegram account (using MTProto direct file streaming), eliminating storage quotas.
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl space-y-1 ${darkMode ? 'bg-slate-900/80 border border-slate-800' : 'bg-white border border-slate-200/80 shadow-2xs'}`}>
                      <p className={`text-xs font-extrabold flex items-center space-x-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Independent Workspace Settings</span>
                      </p>
                      <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Each workspace maintains its own storage destination (e.g. Saved Messages "me", or private channels) and catalogs files separately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspace Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {workspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspaceId;
                  return (
                    <div
                      key={ws.id}
                      className={`rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between space-y-5 ${
                        isActive
                          ? (darkMode
                              ? 'bg-slate-900 border-2 border-sky-500/90 shadow-xl ring-4 ring-sky-500/20 text-white'
                              : 'bg-white border-2 border-sky-500/80 shadow-xl ring-4 ring-sky-500/10 text-slate-900')
                          : cardBg
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                              isActive
                                ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md'
                                : (darkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200')
                            }`}>
                              {ws.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 flex-wrap gap-1">
                                <h3 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ws.name}</h3>
                                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${
                                  darkMode ? 'bg-sky-950 text-sky-400 border-sky-800/60' : 'bg-sky-500/10 text-sky-600 border-sky-400/30'
                                }`}>
                                  ID #{ws.id}
                                </span>
                                {ws.is_default && (
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${
                                    darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>Default</span>
                                )}
                              </div>
                              <p className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>slug: {ws.slug}</p>
                            </div>
                          </div>

                          {isActive && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow-xs">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        {/* Storage Config Box */}
                        <div className={`p-3.5 rounded-2xl space-y-2 ${subCardBg}`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Storage Destination:</span>
                            <span className={`font-bold font-mono text-[11px] truncate max-w-[140px] ${darkMode ? 'text-sky-300' : 'text-slate-800'}`}>
                              {ws.storage_chat === 'me' ? 'Self (Saved Messages)' : ws.storage_chat}
                            </span>
                          </div>

                          <div className={`flex items-center justify-between text-xs pt-1 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200/60'}`}>
                            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Cataloged Files:</span>
                            <span className={`font-extrabold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {ws.file_count || 0} files ({formatBytes(ws.total_bytes || 0)})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className={`space-y-2 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                          {!isActive ? (
                            <button
                              onClick={() => handleSwitchWorkspace(ws.id)}
                              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Set as Active</span>
                            </button>
                          ) : (
                            <div className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold text-center border ${
                              darkMode ? 'bg-sky-950/80 border-sky-800 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
                            }`}>
                              Currently Active
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setVaultWorkspaceFilter(String(ws.id));
                              setDashboardTab('vault');
                            }}
                            className={`p-2 rounded-xl transition border ${
                              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                            title="View files in this workspace"
                          >
                            <HardDrive className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingWorkspace(ws);
                              setEditWorkspaceName(ws.name);
                              setEditWorkspaceStorageChat(ws.storage_chat || 'me');
                            }}
                            className={`p-2 rounded-xl transition border ${
                              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                            title="Edit workspace settings & storage destination"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {workspaces.length > 1 && !ws.is_default && (
                            <button
                              onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                              className={`p-2 rounded-xl transition border ${
                                darkMode ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800/80' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                              }`}
                              title="Delete workspace"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD & DIRECT LINK (BULK QUEUE & SINGLE) */}
          {dashboardTab === 'upload' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className={`rounded-3xl p-6 sm:p-7 transition-colors duration-200 ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className={`text-lg font-extrabold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <UploadCloud className="w-5 h-5 text-sky-500" />
                      <span>Telegram MTProto Cloud Uploader</span>
                    </h2>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Saved to Telegram Chat: <span className="text-sky-400 font-mono font-bold">{storageChat}</span> • User ID: <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.id}</span>
                    </p>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className={`flex items-center p-1 rounded-xl border ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => setUploadTabMode('bulk')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        uploadTabMode === 'bulk'
                          ? 'bg-sky-500 text-white shadow-xs'
                          : darkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Bulk Upload Queue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadTabMode('single')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        uploadTabMode === 'single'
                          ? 'bg-sky-500 text-white shadow-xs'
                          : darkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Single File Custom</span>
                    </button>
                  </div>
                </div>

                {/* Target Workspace Selector */}
                <div className={`mb-5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subCardBg}`}>
                  <div>
                    <label className={`block text-xs font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Destination Workspace (MySQL Tag)
                    </label>
                    <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Select which workspace uploaded files will be indexed under:
                    </p>
                  </div>
                  <select
                    value={uploadWorkspaceId || activeWorkspace?.id || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setUploadWorkspaceId(id);
                      const chosen = workspaces.find((w) => w.id === id);
                      if (chosen?.storage_chat) {
                        setStorageChat(chosen.storage_chat);
                      }
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-bold focus:outline-none ${inputBg}`}
                  >
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id} className={darkMode ? 'bg-slate-900 text-white' : ''}>
                        {w.name} {w.id === activeWorkspaceId ? '★ (Active)' : ''} — Destination: {w.storage_chat === 'me' ? 'Saved Messages' : w.storage_chat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BULK UPLOAD MODE */}
                {uploadTabMode === 'bulk' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Multi-file Dropzone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsBulkDragging(true); }}
                      onDragLeave={() => setIsBulkDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsBulkDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          addFilesToBulkQueue(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => bulkFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[190px] ${
                        isBulkDragging
                          ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10 scale-[1.01]'
                          : uploadQueue.length > 0
                          ? 'border-sky-500/40 bg-sky-500/5'
                          : darkMode
                          ? 'border-slate-700 hover:border-sky-400 bg-slate-950/40 hover:bg-slate-900/60'
                          : 'border-slate-300/80 hover:border-sky-400 bg-white/50 hover:bg-white/80'
                      }`}
                    >
                      <input
                        type="file"
                        ref={bulkFileInputRef}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            addFilesToBulkQueue(e.target.files);
                            if (e.target) e.target.value = '';
                          }
                        }}
                      />

                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20 shadow-sm animate-pulse-glow">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <div>
                          <p className={`text-sm font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            Drop <span className="text-sky-500 underline">multiple files</span> here, or click to browse
                          </p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Select any batch of videos, images, archives (.zip), binaries • Up to 50MB per file
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Batch Options (Password & Tag) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <Lock className="w-3.5 h-3.5 text-sky-500" />
                          <span>Batch Password (Optional)</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Password for all queued files"
                          value={bulkUploadPassword}
                          onChange={(e) => setBulkUploadPassword(e.target.value)}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs ${inputBg}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Batch Tags / Caption Prefix (Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. #batch-upload #release-v1"
                          value={bulkUploadCaption}
                          onChange={(e) => setBulkUploadCaption(e.target.value)}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs ${inputBg}`}
                        />
                      </div>
                    </div>

                    {/* Active Upload Queue View */}
                    {uploadQueue.length > 0 && (
                      <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-3 duration-300">
                        {/* Queue Header & Actions */}
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Upload Queue ({uploadQueue.length} {uploadQueue.length === 1 ? 'file' : 'files'})
                              </h3>
                              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                                {formatBytes(uploadQueue.reduce((acc, it) => acc + it.size, 0))}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {uploadQueue.filter((it) => it.status === 'completed').length} completed • {uploadQueue.filter((it) => it.status === 'queued').length} queued • {uploadQueue.filter((it) => it.status === 'error').length} failed
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => bulkFileInputRef.current?.click()}
                              disabled={isBulkUploading}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Files</span>
                            </button>

                            {uploadQueue.some((it) => it.status === 'completed') && (
                              <>
                                <button
                                  type="button"
                                  onClick={copyAllCompletedLinks}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    copiedBatchAll
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                                  }`}
                                >
                                  {copiedBatchAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedBatchAll ? 'Links Copied!' : 'Copy All Links'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={clearCompletedBulkQueue}
                                  disabled={isBulkUploading}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                                >
                                  Clear Done
                                </button>
                              </>
                            )}

                            {!isBulkUploading && (
                              <button
                                type="button"
                                onClick={clearAllBulkQueue}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Overall Progress Bar during batch upload */}
                        {isBulkUploading && (
                          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between text-xs font-mono font-bold">
                              <span className="flex items-center gap-2 text-sky-400">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Uploading file {activeUploadIndex + 1} of {uploadQueue.length}...</span>
                              </span>
                              <span className="text-slate-200">
                                {Math.round(
                                  (uploadQueue.reduce((acc, it) => acc + (it.status === 'completed' ? 100 : it.status === 'uploading' ? it.progress : 0), 0) /
                                    (uploadQueue.length * 100)) * 100
                                )}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden p-0.5 border border-slate-800">
                              <div
                                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300 relative overflow-hidden"
                                style={{
                                  width: `${Math.round(
                                    (uploadQueue.reduce((acc, it) => acc + (it.status === 'completed' ? 100 : it.status === 'uploading' ? it.progress : 0), 0) /
                                      (uploadQueue.length * 100)) * 100
                                  )}%`
                                }}
                              >
                                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Queue Items List */}
                        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                          {uploadQueue.map((item, idx) => (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                                item.status === 'uploading'
                                  ? 'bg-sky-500/10 border-sky-500/50 shadow-md'
                                  : item.status === 'completed'
                                  ? 'bg-emerald-500/5 border-emerald-500/30'
                                  : item.status === 'error'
                                  ? 'bg-rose-500/10 border-rose-500/30'
                                  : darkMode
                                  ? 'bg-slate-950/60 border-slate-800'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  item.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : darkMode
                                    ? 'bg-slate-900 text-sky-400 border border-slate-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {item.status === 'completed' ? (
                                    <Check className="w-5 h-5 animate-checkmark-pop text-emerald-400" />
                                  ) : (
                                    getFileIcon(item.type, item.name)
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`} title={item.name}>
                                      {item.name}
                                    </p>
                                    {item.status === 'completed' && item.result?.message_id && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold shrink-0">
                                        #{item.result.message_id}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                                    <span>{formatBytes(item.size)}</span>
                                    <span>•</span>
                                    {item.status === 'queued' && <span className="text-slate-400 font-medium">Ready in queue</span>}
                                    {item.status === 'uploading' && (
                                      <span className="text-sky-400 font-bold flex items-center gap-1">
                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Streaming {item.progress}%
                                      </span>
                                    )}
                                    {item.status === 'completed' && <span className="text-emerald-400 font-bold">Uploaded & Indexed</span>}
                                    {item.status === 'error' && <span className="text-rose-400 font-bold">{item.error || 'Failed'}</span>}
                                  </div>

                                  {/* Progress bar during uploading */}
                                  {item.status === 'uploading' && (
                                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                                      <div
                                        className="bg-gradient-to-r from-sky-400 to-indigo-500 h-1.5 rounded-full transition-all duration-300 relative overflow-hidden"
                                        style={{ width: `${item.progress}%` }}
                                      >
                                        <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Completed Link and Actions */}
                              <div className="flex items-center space-x-1.5 shrink-0">
                                {item.status === 'completed' && item.result?.direct_link && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(item.result!.direct_link!, `queue-${item.id}`)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        copiedId === `queue-${item.id}`
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                                      }`}
                                    >
                                      {copiedId === `queue-${item.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedId === `queue-${item.id}` ? 'Copied' : 'Copy Link'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setQrModalFile(item.result!)}
                                      className="p-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition cursor-pointer"
                                      title="QR Code"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                    </button>

                                    <a
                                      href={item.result.direct_link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center"
                                      title="Open Stream"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </>
                                )}

                                {item.status === 'error' && (
                                  <button
                                    type="button"
                                    onClick={() => retryBulkQueueItem(item.id)}
                                    className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center gap-1 border border-rose-500/30 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Retry</span>
                                  </button>
                                )}

                                {item.status !== 'uploading' && (
                                  <button
                                    type="button"
                                    onClick={() => removeBulkQueueItem(item.id)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                    title="Remove from queue"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bulk Upload Start Trigger */}
                        <button
                          type="button"
                          onClick={startBulkUploadProcess}
                          disabled={isBulkUploading || !uploadQueue.some((it) => it.status === 'queued' || it.status === 'error')}
                          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-xl ${
                            isBulkUploading || !uploadQueue.some((it) => it.status === 'queued' || it.status === 'error')
                              ? (darkMode ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60')
                              : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 active:scale-[0.99] cursor-pointer'
                          }`}
                        >
                          {isBulkUploading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Uploading {uploadQueue.length} Files to Telegram & MySQL...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>
                                {uploadQueue.every((it) => it.status === 'completed')
                                  ? 'All Files Uploaded Successfully!'
                                  : `Start Bulk Upload (${uploadQueue.filter((it) => it.status === 'queued' || it.status === 'error').length} Files)`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* SINGLE FILE CUSTOM MODE */}
                {uploadTabMode === 'single' && (
                  <form onSubmit={handleUploadSubmit} className="space-y-5 animate-in fade-in duration-200">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
                        selectedFile
                          ? (darkMode ? 'border-sky-500/80 bg-sky-950/40 shadow-inner' : 'border-sky-400/80 bg-sky-50/50 shadow-inner')
                          : (darkMode ? 'border-slate-700 hover:border-sky-400 bg-slate-950/40 hover:bg-slate-900/60' : 'border-slate-300/80 hover:border-sky-400 bg-white/50 hover:bg-white/80')
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                            setCustomUploadName(e.target.files[0].name);
                            setUploadResult(null);
                          }
                        }}
                      />

                      {selectedFile ? (
                        <div className="flex flex-col items-center space-y-2.5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sky-400 ${
                            darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-md border border-slate-100'
                          }`}>
                            {getFileIcon(selectedFile.type, selectedFile.name)}
                          </div>
                          <p className={`font-bold text-base truncate max-w-xs sm:max-w-md ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {selectedFile.name}
                          </p>
                          <p className={`text-xs font-mono font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatBytes(selectedFile.size)} • {selectedFile.type || 'Binary / Document'}
                          </p>
                          <span className="text-xs font-semibold text-sky-400 underline pt-1">Click to select different file</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sky-400 ${
                            darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-md border border-slate-100'
                          }`}>
                            <UploadCloud className="w-7 h-7" />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              Click to browse or drag & drop single file here
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              Custom file name and caption override
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedFile && (
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          File Name (Stored in MySQL Catalog)
                        </label>
                        <input
                          type="text"
                          value={customUploadName}
                          onChange={(e) => setCustomUploadName(e.target.value)}
                          placeholder="File name"
                          className={`w-full rounded-xl px-4 py-2.5 text-xs font-mono ${inputBg}`}
                        />
                      </div>
                    )}

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Optional Caption or Tags
                      </label>
                      <input
                        type="text"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="e.g. Project Archive v1 or #backup #docs"
                        className={`w-full rounded-xl px-4 py-2.5 text-xs ${inputBg}`}
                      />
                    </div>

                    {isUploading && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-sky-400 flex items-center space-x-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Streaming chunks via Telethon MTProto & writing to MySQL...</span>
                          </span>
                          <span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{uploadProgress}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2.5 overflow-hidden p-0.5 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div
                            className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2 rounded-full transition-all duration-300 shadow-sm"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {uploadError && (
                      <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border ${
                        darkMode ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedFile || isUploading}
                      className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                        !selectedFile || isUploading
                          ? (darkMode ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60')
                          : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 active:scale-[0.99] cursor-pointer'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>{isUploading ? 'Uploading to Telegram & MySQL...' : 'Upload & Generate Direct Link'}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Upload Result Card for Single Upload Mode */}
              {uploadResult && uploadTabMode === 'single' && (
                <div className={`border border-emerald-500/80 rounded-3xl p-7 relative overflow-hidden transition-colors duration-200 ${cardBg}`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xs">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>File Saved to MTProto & MySQL!</h3>
                      <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Message ID #{uploadResult.message_id} • Linked to Telegram ID #{user?.id}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl space-y-4 ${subCardBg}`}>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Direct HTTP Access Link (Stream / Download):</span>
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">Public & Streamable</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={uploadResult.direct_link || ''}
                          className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono text-sky-400 select-all ${inputBg}`}
                        />
                        <button
                          onClick={() => copyToClipboard(uploadResult.direct_link || '', 'direct-res')}
                          className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          {copiedId === 'direct-res' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === 'direct-res' ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setQrModalFile({
                              message_id: uploadResult.message_id,
                              file_name: uploadResult.file_name,
                              file_size: uploadResult.file_size,
                              mime_type: uploadResult.mime_type || '',
                              direct_link: uploadResult.direct_link
                            } as StorageFile);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                          title="Generate QR code for mobile scanning"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Code</span>
                        </button>
                        <a
                          href={uploadResult.direct_link}
                          target="_blank"
                          rel="noreferrer"
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                            darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FILES VAULT */}
          {dashboardTab === 'vault' && (
            <div className="space-y-6">
              {/* Header with Search and View Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg font-extrabold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <HardDrive className="w-5 h-5 text-sky-500" />
                      <span>Files Vault</span>
                    </h2>
                    {activeWorkspace && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        {activeWorkspace.name}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Storage registry for Telegram Account ID: <span className="text-sky-400 font-mono font-bold">{user?.id}</span>
                    {activeWorkspace && (
                      <span className="ml-1.5 opacity-80">
                        • Channel / Destination: <strong className="font-mono text-slate-300">{activeWorkspace.storage_chat === 'me' ? 'Saved Messages' : activeWorkspace.storage_chat}</strong>
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`flex items-center rounded-xl p-1 border shadow-xs ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-sky-500 text-white' : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500')}`}
                      title="Table List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-sky-500 text-white' : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500')}`}
                      title="Card Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setDashboardTab('upload');
                      setUploadTabMode('bulk');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 flex items-center space-x-1.5 transition cursor-pointer active:scale-95"
                    title="Upload multiple files with smooth animations"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Files</span>
                  </button>

                  <button
                    onClick={handleFetchOldFiles}
                    disabled={isFetchingOldFiles}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border shadow-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50 ${
                      darkMode ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30' : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                    }`}
                    title="Scan Telegram channel history and import old files into MySQL"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingOldFiles ? 'animate-spin text-sky-400' : 'text-sky-500'}`} />
                    <span>{isFetchingOldFiles ? 'Scanning...' : 'Fetch Old Files'}</span>
                  </button>

                  <button
                    onClick={fetchFiles}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border shadow-xs flex items-center space-x-1.5 transition ${
                      darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin text-sky-500' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>
              </div>

              {/* Status Banner when Old Files are Fetched */}
              {fetchOldFilesStatus && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{fetchOldFilesStatus}</span>
                </div>
              )}

              {/* Bulk Action Bar (when files are selected) */}
              {selectedFileIds.length > 0 && (
                <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-xs">
                      {selectedFileIds.length}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-white">
                        {selectedFileIds.length} {selectedFileIds.length === 1 ? 'file' : 'files'} selected
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Total size: {formatBytes(selectedTotalBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      onClick={handleOpenManifest}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center space-x-1.5 transition active:scale-95"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Shared Manifest Link</span>
                    </button>

                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center space-x-1.5 transition active:scale-95"
                    >
                      {isBulkDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete Selected ({selectedFileIds.length})</span>
                    </button>

                    <button
                      onClick={clearSelection}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Tabs and Workspace Pills */}
              <div className="space-y-3">
                {/* Workspace Filter Pills: Only shown if user is NOT in a dedicated workspace */}
                {!activeWorkspace && (
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x -mx-1 px-1">
                    <span className={`text-xs font-bold whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Workspace:</span>
                    <button
                      onClick={() => setVaultWorkspaceFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 flex-shrink-0 ${
                        vaultWorkspaceFilter === 'all'
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs'
                          : (darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200')
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Workspaces ({files.length})</span>
                    </button>
                    {workspaces.map((w) => {
                      const wsFilesCount = files.filter(
                        (f) => String(f.workspace_id) === String(w.id) || (!f.workspace_id && w.is_default)
                      ).length;
                      return (
                        <button
                          key={w.id}
                          onClick={() => setVaultWorkspaceFilter(String(w.id))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 flex-shrink-0 ${
                            vaultWorkspaceFilter === String(w.id)
                              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs'
                              : (darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200')
                          }`}
                        >
                          <span>{w.name}</span>
                          <span className={`text-[10px] px-1 py-0.2 rounded font-mono font-bold ${
                            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>ID #{w.id}</span>
                          <span className="text-[10px] opacity-80 font-mono">({wsFilesCount})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl transition-colors duration-200 ${cardBg}`}>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <input
                      type="search"
                      name="telecloud_files_vault_filter"
                      id="telecloud_files_vault_filter"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                      placeholder="Search files by name, caption, workspace..."
                      className={`w-full sm:w-80 rounded-xl px-3.5 py-2 text-xs ${inputBg}`}
                    />

                    {filteredFiles.length > 0 && (
                      <button
                        onClick={toggleSelectAll}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border shadow-xs flex items-center space-x-1.5 transition whitespace-nowrap ${
                          darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${allFilteredSelected ? 'bg-sky-500 border-sky-500 text-white' : (darkMode ? 'border-slate-600' : 'border-slate-300')}`}>
                          {allFilteredSelected && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span>{allFilteredSelected ? 'Deselect All' : `Select All (${filteredFiles.length})`}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <div className="flex items-center space-x-1">
                      {['all', 'images', 'videos', 'audio', 'documents'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFileTypeFilter(cat)}
                          className={`px-3 py-1 text-xs rounded-xl capitalize font-semibold transition whitespace-nowrap ${
                            fileTypeFilter === cat
                              ? 'bg-sky-500 text-white shadow-xs'
                              : (darkMode ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100')
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Sorting Dropdown Component */}
                    <div className="relative flex-shrink-0" ref={sortDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setSortDropdownOpen((prev) => !prev)}
                        className={`px-3 py-1 text-xs rounded-xl font-bold border shadow-xs flex items-center space-x-1.5 transition whitespace-nowrap ${
                          sortDropdownOpen
                            ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-500 text-white'
                            : darkMode
                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                        title="Sort files by Name, Size, or Upload Date"
                        aria-label="Sort files"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sort:</span>
                        <span>{currentSortObj.iconLabel}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {sortDropdownOpen && (
                        <div
                          className={`absolute right-0 mt-2 w-64 rounded-2xl p-2 shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150 ${
                            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold border-b mb-1 flex items-center justify-between ${
                            darkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                          }`}>
                            <span>Sort Files By</span>
                            <span className="text-[9px] lowercase opacity-75">asc / desc</span>
                          </div>

                          {/* Group: Upload Date */}
                          <div className="mb-1.5">
                            <div className="px-2.5 py-1 text-[10px] font-bold text-sky-500 uppercase tracking-wider">
                              Upload Date
                            </div>
                            <button
                              type="button"
                              onClick={() => { setFileSort('date_desc'); setSortDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                fileSort === 'date_desc'
                                  ? (darkMode ? 'bg-sky-950/80 text-sky-400 font-bold' : 'bg-sky-50 text-sky-700 font-bold')
                                  : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                                <span>Newest first (Descending)</span>
                              </div>
                              {fileSort === 'date_desc' && <Check className="w-3.5 h-3.5 text-sky-500" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFileSort('date_asc'); setSortDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                fileSort === 'date_asc'
                                  ? (darkMode ? 'bg-sky-950/80 text-sky-400 font-bold' : 'bg-sky-50 text-sky-700 font-bold')
                                  : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                                <span>Oldest first (Ascending)</span>
                              </div>
                              {fileSort === 'date_asc' && <Check className="w-3.5 h-3.5 text-sky-500" />}
                            </button>
                          </div>

                          {/* Group: File Name */}
                          <div className="mb-1.5">
                            <div className="px-2.5 py-1 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                              File Name
                            </div>
                            <button
                              type="button"
                              onClick={() => { setFileSort('name_asc'); setSortDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                fileSort === 'name_asc'
                                  ? (darkMode ? 'bg-indigo-950/80 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold')
                                  : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                                <span>Name: A → Z (Ascending)</span>
                              </div>
                              {fileSort === 'name_asc' && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFileSort('name_desc'); setSortDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                fileSort === 'name_desc'
                                  ? (darkMode ? 'bg-indigo-950/80 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold')
                                  : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                                <span>Name: Z → A (Descending)</span>
                              </div>
                              {fileSort === 'name_desc' && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                            </button>
                          </div>

                          {/* Group: File Size */}
                          <div>
                            <div className="px-2.5 py-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                              File Size
                            </div>
                            <button
                              type="button"
                              onClick={() => { setFileSort('size_desc'); setSortDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                fileSort === 'size_desc'
                                  ? (darkMode ? 'bg-emerald-950/80 text-emerald-400 font-bold' : 'bg-emerald-50 text-emerald-700 font-bold')
                                  : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                                <span>Largest first (Descending)</span>
                              </div>
                              {fileSort === 'size_desc' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFileSort('size_asc'); setSortDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                fileSort === 'size_asc'
                                  ? (darkMode ? 'bg-emerald-950/80 text-emerald-400 font-bold' : 'bg-emerald-50 text-emerald-700 font-bold')
                                  : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                                <span>Smallest first (Ascending)</span>
                              </div>
                              {fileSort === 'size_asc' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* File Content: Table View vs Grid View */}
              {loadingFiles ? (
                <div className={`p-12 text-center rounded-3xl ${cardBg}`}>
                  <RefreshCw className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Querying Telegram Cloud Storage...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl ${cardBg} space-y-4`}>
                  <HardDrive className="w-12 h-12 text-slate-500 mx-auto" />
                  <div>
                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>No files found</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Upload a new file or fetch and import historical files from your linked Telegram chat ({activeWorkspace?.storage_chat || storageChat || 'Saved Messages'}).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setDashboardTab('upload')}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload File</span>
                    </button>
                    <button
                      onClick={handleFetchOldFiles}
                      disabled={isFetchingOldFiles}
                      className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition active:scale-95 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetchingOldFiles ? 'animate-spin' : ''}`} />
                      <span>{isFetchingOldFiles ? 'Scanning Telegram...' : 'Fetch Old Files from Telegram'}</span>
                    </button>
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
                /* Card Grid View with Checkboxes */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedFiles.map((file) => {
                    const isSelected = selectedFileIds.includes(file.message_id);
                    return (
                      <div
                        key={file.message_id}
                        className={`p-4 rounded-3xl transition flex flex-col justify-between space-y-3 group relative ${
                          isSelected
                            ? (darkMode ? 'bg-sky-950/80 border-2 border-sky-500 ring-2 ring-sky-500/30' : 'bg-sky-50/70 border-2 border-sky-500 ring-2 ring-sky-500/20 shadow-md')
                            : cardBg
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectFile(file.message_id)}
                              aria-label={`Select ${file.file_name}`}
                              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer accent-sky-600"
                            />
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                              darkMode ? 'bg-slate-950 border border-slate-800 text-sky-400' : 'bg-slate-50 border border-slate-100'
                            }`}>
                              {getFileIcon(file.mime_type, file.file_name)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setReassignFileModal(file);
                                setReassignTargetWorkspaceId(file.workspace_id || activeWorkspaceId || workspaces[0]?.id || 1);
                              }}
                              className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`}
                              title="Reassign to another Workspace"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingFile(file);
                                setNewFileNameInput(file.file_name);
                              }}
                              className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'}`}
                              title="Rename File"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.message_id)}
                              className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-rose-950 text-slate-400 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Beautiful Media Preview Thumbnail for Grid Cards */}
                        <GridImagePreview file={file} darkMode={darkMode} getFileIcon={getFileIcon} />

                        <div>
                          <div className="flex items-center space-x-1.5 mb-1.5 flex-wrap gap-1">
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded-md inline-flex items-center space-x-1.5 border ${
                              darkMode ? 'bg-sky-950/80 text-sky-300 border-sky-800/80' : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              <span className="opacity-75">ID:</span>
                              <span className="select-all">{getFileShortId(file.message_id)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(getFileShortId(file.message_id), `fid-${file.message_id}`);
                                }}
                                className="focus:outline-hidden cursor-pointer"
                                title="Copy Short File ID"
                              >
                                {copiedId === `fid-${file.message_id}` ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-slate-400 hover:text-sky-400" />
                                )}
                              </button>
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md inline-flex items-center space-x-1 border ${
                              darkMode ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              <Layers className="w-2.5 h-2.5 text-indigo-400" />
                              <span>{file.workspace_name || activeWorkspace?.name || 'Default Workspace'}</span>
                              {file.workspace_id && <span className="font-mono text-[9px] opacity-75">#{file.workspace_id}</span>}
                            </span>
                            <span className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                              TG: {file.storage_chat === 'me' ? 'Saved' : file.storage_chat}
                            </span>
                          </div>
                          <h4 className={`font-bold text-xs truncate ${darkMode ? 'text-white' : 'text-slate-900'}`} title={file.file_name}>
                            {file.file_name}
                          </h4>
                          <p className={`text-[11px] font-mono mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                            {formatBytes(file.file_size)} • {file.created_at || file.date ? new Date(file.created_at || file.date || '').toLocaleDateString() : 'N/A'}
                          </p>
                        </div>

                        <div className={`pt-2 border-t flex items-center justify-between gap-1.5 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                          <button
                            onClick={() => setPreviewFile(file)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
                              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => setQrModalFile(file)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
                              darkMode ? 'bg-amber-950/80 text-amber-300 hover:bg-amber-900 border border-amber-800/80' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80'
                            }`}
                            title="Scan / Share QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR</span>
                          </button>
                          <button
                            onClick={() => copyToClipboard(file.direct_link || '', `grid-${file.message_id}`)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition ${
                              darkMode ? 'bg-sky-950/80 text-sky-300 hover:bg-sky-900' : 'bg-sky-50 hover:bg-sky-100 text-sky-600'
                            }`}
                          >
                            {copiedId === `grid-${file.message_id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `grid-${file.message_id}` ? 'Copied' : 'Link'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table List View with Checkboxes */
                <div className={`rounded-3xl overflow-hidden transition-colors duration-200 ${cardBg}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={`font-bold ${tableHeaderBg}`}>
                        <tr>
                          <th className="py-3.5 px-4 w-10">
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              ref={(el) => { if (el) el.indeterminate = someFilteredSelected; }}
                              onChange={toggleSelectAll}
                              aria-label="Select all files"
                              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer accent-sky-600"
                            />
                          </th>
                          <th className="py-3.5 px-4">File ID</th>
                          <th
                            onClick={() => setFileSort((prev) => (prev === 'name_asc' ? 'name_desc' : 'name_asc'))}
                            className="py-3.5 px-4 cursor-pointer select-none hover:text-sky-500 transition group"
                            title="Click to sort by File Name (Ascending / Descending)"
                          >
                            <div className="flex items-center space-x-1.5">
                              <span>File Name</span>
                              {fileSort === 'name_asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-sky-500" />
                              ) : fileSort === 'name_desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-sky-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-75 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th className="py-3.5 px-4">Workspace</th>
                          <th
                            onClick={() => setFileSort((prev) => (prev === 'size_desc' ? 'size_asc' : 'size_desc'))}
                            className="py-3.5 px-4 cursor-pointer select-none hover:text-sky-500 transition group"
                            title="Click to sort by File Size (Largest / Smallest)"
                          >
                            <div className="flex items-center space-x-1.5">
                              <span>Size</span>
                              {fileSort === 'size_desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-sky-500" />
                              ) : fileSort === 'size_asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-sky-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-75 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th className="py-3.5 px-4">Type</th>
                          <th
                            onClick={() => setFileSort((prev) => (prev === 'date_desc' ? 'date_asc' : 'date_desc'))}
                            className="py-3.5 px-4 cursor-pointer select-none hover:text-sky-500 transition group"
                            title="Click to sort by Upload Date (Newest / Oldest)"
                          >
                            <div className="flex items-center space-x-1.5">
                              <span>Upload Date</span>
                              {fileSort === 'date_desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-sky-500" />
                              ) : fileSort === 'date_asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-sky-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-75 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {sortedFiles.map((file) => {
                          const isSelected = selectedFileIds.includes(file.message_id);
                          return (
                            <tr
                              key={file.message_id}
                              className={`transition ${
                                isSelected
                                  ? (darkMode ? 'bg-sky-950/70 font-medium' : 'bg-sky-50/80 font-medium')
                                  : (darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-sky-50/30')
                              }`}
                            >
                              <td className="py-3.5 px-4 w-10">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectFile(file.message_id)}
                                  aria-label={`Select ${file.file_name}`}
                                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer accent-sky-600"
                                />
                              </td>
                              <td className="py-3.5 px-4 font-mono">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-extrabold text-sky-400 select-all">{getFileShortId(file.message_id)}</span>
                                  <button
                                    onClick={() => copyToClipboard(getFileShortId(file.message_id), `fid-${file.message_id}`)}
                                    title="Copy Short File ID"
                                    className={`p-1 rounded-lg transition ${
                                      copiedId === `fid-${file.message_id}`
                                        ? 'text-emerald-400'
                                        : darkMode
                                        ? 'text-slate-500 hover:text-sky-400 hover:bg-slate-800'
                                        : 'text-slate-400 hover:text-sky-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {copiedId === `fid-${file.message_id}` ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    darkMode ? 'bg-slate-950 border border-slate-800 text-sky-400' : 'bg-white shadow-xs border border-slate-200'
                                  }`}>
                                    {getFileIcon(file.mime_type, file.file_name)}
                                  </div>
                                  <div className="min-w-0 max-w-xs sm:max-w-md">
                                    <p className={`font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{file.file_name}</p>
                                    {file.original_name && file.original_name !== file.file_name && (
                                      <p className={`text-[10px] truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Orig: {file.original_name}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-xl inline-flex items-center space-x-1 border ${
                                    darkMode ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80' : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                                  }`}>
                                    <Layers className="w-3 h-3 text-indigo-400" />
                                    <span>{file.workspace_name || activeWorkspace?.name || 'Default Workspace'}</span>
                                    {file.workspace_id && <span className="font-mono text-[9px] opacity-75">#{file.workspace_id}</span>}
                                  </span>
                                  <p className={`text-[10px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    TG: {file.storage_chat === 'me' ? 'Saved Messages' : file.storage_chat}
                                  </p>
                                </div>
                              </td>
                              <td className={`py-3.5 px-4 font-mono font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{formatBytes(file.file_size)}</td>
                              <td className={`py-3.5 px-4 font-mono text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {file.mime_type ? file.mime_type.split('/')[1] : 'file'}
                              </td>
                              <td className={`py-3.5 px-4 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {file.created_at || file.date ? new Date(file.created_at || file.date || '').toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setReassignFileModal(file);
                                      setReassignTargetWorkspaceId(file.workspace_id || activeWorkspaceId || workspaces[0]?.id || 1);
                                    }}
                                    title="Move / Reassign to another Workspace"
                                    className={`p-2 rounded-xl shadow-xs transition ${darkMode ? 'bg-indigo-950/80 text-indigo-300 hover:bg-indigo-900' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingFile(file);
                                      setNewFileNameInput(file.file_name);
                                    }}
                                    title="Rename File"
                                    className={`p-2 rounded-xl shadow-xs transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setPreviewFile(file)}
                                    title="Inspect & Preview"
                                    className={`p-2 rounded-xl border shadow-xs transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(file.direct_link || '', `file-${file.message_id}`)}
                                    title="Copy Direct Link"
                                    className={`p-2 rounded-xl border shadow-xs transition ${darkMode ? 'bg-sky-950/80 hover:bg-sky-900 text-sky-300 border-sky-800/80' : 'bg-sky-50 hover:bg-sky-100 text-sky-600 border-sky-200/80'}`}
                                  >
                                    {copiedId === `file-${file.message_id}` ? (
                                      <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setQrModalFile(file)}
                                    title="Generate & View QR Code for Mobile Scanning"
                                    className={`p-2 rounded-xl border shadow-xs transition ${darkMode ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-800/80' : 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200/80'}`}
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={file.direct_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Direct Download"
                                    className={`p-2 rounded-xl border shadow-xs transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={() => handleDeleteFile(file.message_id)}
                                    title="Delete File"
                                    className={`p-2 rounded-xl border shadow-xs transition ${darkMode ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800/80' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FILE SERVE ANALYTICS & STORAGE CLEANUP */}
          {dashboardTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg font-extrabold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <Activity className="w-5 h-5 text-amber-500" />
                      <span>File Serve Analytics & Storage Cleanup</span>
                    </h2>
                    {activeWorkspace && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {activeWorkspace.name}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Real-time CDN serve counts, access recency metrics, and automated storage purging
                  </p>
                </div>

                <button
                  onClick={fetchAnalytics}
                  disabled={analyticsLoading}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border shadow-xs flex items-center space-x-1.5 transition cursor-pointer ${
                    darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin text-amber-500' : ''}`} />
                  <span>Refresh Metrics</span>
                </button>
              </div>

              {/* Cleanup Success Banner */}
              {cleanupSuccessNotice && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-400 text-xs font-semibold animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{cleanupSuccessNotice}</span>
                  </div>
                  <button onClick={() => setCleanupSuccessNotice(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Serves / Streams</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black font-mono tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {analyticsStats?.totalServes || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    across {analyticsStats?.totalFiles || 0} catalog files ({formatBytes(analyticsStats?.totalSizeBytes || 0)})
                  </p>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Never Served (0 Serves)</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                      <FileQuestion className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black font-mono tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {analyticsStats?.neverAccessedCount || 0} <span className="text-xs font-sans text-slate-400 font-normal">files</span>
                  </p>
                  <p className="text-[11px] text-sky-400 font-mono mt-1">
                    Reclaimable: {formatBytes(analyticsStats?.neverAccessedBytes || 0)}
                  </p>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Unaccessed &gt; 7 Days</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black font-mono tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {analyticsStats?.unaccessed7DaysCount || 0} <span className="text-xs font-sans text-slate-400 font-normal">files</span>
                  </p>
                  <p className="text-[11px] text-amber-400 font-mono mt-1">
                    Reclaimable: {formatBytes(analyticsStats?.unaccessed7DaysBytes || 0)}
                  </p>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dormant &gt; 30 Days</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black font-mono tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {analyticsStats?.unaccessed30DaysCount || 0} <span className="text-xs font-sans text-slate-400 font-normal">files</span>
                  </p>
                  <p className="text-[11px] text-purple-400 font-mono mt-1">
                    Reclaimable: {formatBytes(analyticsStats?.unaccessed30DaysBytes || 0)}
                  </p>
                </div>
              </div>

              {/* Automated Storage Purging Banner */}
              <div className={`p-5 rounded-3xl border space-y-3 ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>One-Click Automated Storage Cleanup Rules</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Purge unaccessed or cold files directly from your MySQL catalog and Telegram MTProto cloud
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCleanupModalRule('not_accessed_7_days')}
                      disabled={(analyticsStats?.unaccessed7DaysCount || 0) === 0}
                      className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-md shadow-rose-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      Purge Unaccessed (&gt; 7 Days) [{analyticsStats?.unaccessed7DaysCount || 0}]
                    </button>

                    <button
                      type="button"
                      onClick={() => setCleanupModalRule('never_accessed')}
                      disabled={(analyticsStats?.neverAccessedCount || 0) === 0}
                      className="px-3 py-2 rounded-xl text-xs font-bold border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition cursor-pointer disabled:opacity-50"
                    >
                      Purge Never Served (0 Serves) [{analyticsStats?.neverAccessedCount || 0}]
                    </button>

                    <button
                      type="button"
                      onClick={() => setCleanupModalRule('not_accessed_30_days')}
                      disabled={(analyticsStats?.unaccessed30DaysCount || 0) === 0}
                      className="px-3 py-2 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition cursor-pointer disabled:opacity-50"
                    >
                      Purge Dormant (&gt; 30 Days) [{analyticsStats?.unaccessed30DaysCount || 0}]
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters & Selection Toolbar */}
              <div className={`p-4 sm:p-5 rounded-3xl space-y-4 ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800/40">
                  {/* Filter Option Tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAnalyticsFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        analyticsFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : darkMode ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Files ({analyticsStats?.totalFiles || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsFilter('most_accessed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        analyticsFilter === 'most_accessed'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : darkMode ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Most Accessed (Top Served)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsFilter('never_accessed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        analyticsFilter === 'never_accessed'
                          ? 'bg-sky-500 text-white shadow-xs'
                          : darkMode ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileQuestion className="w-3.5 h-3.5 text-sky-400" />
                      <span>Never Served ({analyticsStats?.neverAccessedCount || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsFilter('unaccessed_7_days')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        analyticsFilter === 'unaccessed_7_days'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : darkMode ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Unaccessed &gt; 7 Days ({analyticsStats?.unaccessed7DaysCount || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsFilter('unaccessed_30_days')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        analyticsFilter === 'unaccessed_30_days'
                          ? 'bg-purple-500 text-white shadow-xs'
                          : darkMode ? 'bg-slate-800/60 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Unaccessed &gt; 30 Days ({analyticsStats?.unaccessed30DaysCount || 0})</span>
                    </button>
                  </div>

                  {/* Multi-selection Purge Trigger */}
                  {selectedAnalyticsFileIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCleanupModalRule('custom')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Selected ({selectedAnalyticsFileIds.length} Files)</span>
                    </button>
                  )}
                </div>

                {/* File List */}
                {analyticsFiles.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                      <Activity className="w-6 h-6" />
                    </div>
                    <p className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      No files match the selected analytics filter
                    </p>
                    <p className="text-xs text-slate-400">
                      Try selecting a different filter above or upload new files to your vault.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                          <th className="py-3 px-3 w-10">
                            <input
                              type="checkbox"
                              checked={selectedAnalyticsFileIds.length === analyticsFiles.length && analyticsFiles.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAnalyticsFileIds(analyticsFiles.map((f) => String(f.id)));
                                } else {
                                  setSelectedAnalyticsFileIds([]);
                                }
                              }}
                              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-3">File Catalog Name</th>
                          <th className="py-3 px-3">Size & Workspace</th>
                          <th className="py-3 px-3">Serve Count</th>
                          <th className="py-3 px-3">Last Access Recency</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {analyticsFiles.map((file) => {
                          const isSelected = selectedAnalyticsFileIds.includes(String(file.id));
                          return (
                            <tr
                              key={file.id || file.message_id}
                              className={`transition ${
                                isSelected
                                  ? (darkMode ? 'bg-rose-950/20' : 'bg-rose-50/50')
                                  : (darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50')
                              }`}
                            >
                              <td className="py-3 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const idStr = String(file.id);
                                    if (e.target.checked) {
                                      setSelectedAnalyticsFileIds((prev) => [...prev, idStr]);
                                    } else {
                                      setSelectedAnalyticsFileIds((prev) => prev.filter((it) => it !== idStr));
                                    }
                                  }}
                                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                                />
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    file.access_count > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {getFileIcon(file.mime_type, file.file_name)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`font-bold truncate max-w-xs sm:max-w-md ${darkMode ? 'text-white' : 'text-slate-900'}`} title={file.file_name}>
                                      {file.file_name}
                                    </p>
                                    <p className="text-[10px] font-mono text-slate-400">
                                      #{file.message_id} • Slug: {file.file_slug || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 font-mono">
                                <div>{formatBytes(file.file_size)}</div>
                                <span className="text-[10px] text-amber-400">
                                  {file.workspace_name || 'Default'}
                                </span>
                              </td>

                              <td className="py-3 px-3 font-mono">
                                {file.access_count > 0 ? (
                                  <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                                    <Flame className="w-3 h-3 text-amber-500" />
                                    <span>{file.access_count} {file.access_count === 1 ? 'serve' : 'serves'}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-fit">
                                    <FileQuestion className="w-3 h-3" />
                                    <span>0 serves (Never)</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 font-mono text-[11px]">
                                {file.last_accessed_at ? (
                                  <div className="space-y-0.5">
                                    <span className="text-slate-200 font-bold block">
                                      {file.days_since_last_access === 0 ? 'Today' : `${file.days_since_last_access} days ago`}
                                    </span>
                                    <span className="text-slate-500 text-[10px]">
                                      {new Date(file.last_accessed_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="text-sky-400 font-bold block">Never accessed</span>
                                    <span className="text-slate-500 text-[10px]">
                                      Uploaded {file.days_since_last_access} days ago
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(file.direct_link, `anal-${file.id}`)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      copiedId === `anal-${file.id}`
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                    }`}
                                  >
                                    {copiedId === `anal-${file.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedId === `anal-${file.id}` ? 'Copied' : 'Link'}</span>
                                  </button>

                                  <a
                                    href={file.direct_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                                    title="Open / Stream File"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!confirm(`Are you sure you want to permanently delete "${file.file_name}"?`)) return;
                                      try {
                                        await safeJsonFetch(`/api/admin/files/${file.id}`, { method: 'DELETE' });
                                        fetchAnalytics();
                                        fetchFiles();
                                        fetchStats();
                                      } catch (e: any) {
                                        alert(e.message || 'Failed to delete file');
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                    title="Delete file"
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
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MEDIA STREAMER */}
          {dashboardTab === 'streamer' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-3xl transition-colors duration-200 ${cardBg}`}>
                <h2 className={`text-lg font-extrabold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Film className="w-5 h-5 text-indigo-500" />
                  <span>Media Streamer & Live Player</span>
                </h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Test and stream video and audio files directly via HTTP Range partial content streams.
                </p>
              </div>

              {activeMediaStream ? (
                <div className={`p-6 rounded-3xl space-y-4 transition-colors duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeMediaStream.file_name}</h3>
                      <p className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatBytes(activeMediaStream.file_size)}</p>
                    </div>
                    <button
                      onClick={() => setActiveMediaStream(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Close Player
                    </button>
                  </div>

                  {activeMediaStream.mime_type?.startsWith('video/') && (
                    <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
                      <video controls autoPlay src={activeMediaStream.direct_link} className="w-full h-full object-contain">
                        Your browser does not support HTML5 video streaming.
                      </video>
                    </div>
                  )}

                  {activeMediaStream.mime_type?.startsWith('audio/') && (
                    <div className={`p-4 rounded-2xl ${subCardBg}`}>
                      <audio controls autoPlay src={activeMediaStream.direct_link} className="w-full">
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Media Files Selection List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files
                  .filter((f) => f.mime_type?.startsWith('video/') || f.mime_type?.startsWith('audio/'))
                  .map((media) => (
                    <div
                      key={media.message_id}
                      className={`p-4 rounded-3xl space-y-3 flex flex-col justify-between transition-colors duration-200 ${cardBg}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          darkMode ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {media.mime_type?.startsWith('video/') ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-xs truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{media.file_name}</p>
                          <p className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatBytes(media.file_size)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveMediaStream(media)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Stream Now</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: DIRECT LINKS HUB */}
          {/* TAB 6: VISUAL STORAGE DESTINATION PICKER & PREFERENCES */}
          {dashboardTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header card */}
              <div className={`p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200 ${cardBg}`}>
                <div>
                  <h2 className={`text-lg font-extrabold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Sliders className="w-5 h-5 text-sky-500" />
                    <span>Cloud Storage Destination</span>
                  </h2>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select where your files are securely stored inside Telegram. Direct access streaming links are generated for all uploaded items.
                  </p>
                </div>

                {!user?.is_bot && (
                  <button
                    onClick={fetchAvailableChats}
                    disabled={loadingChats}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border shadow-xs flex items-center space-x-2 transition self-start sm:self-auto ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingChats ? 'animate-spin text-sky-500' : ''}`} />
                    <span>{loadingChats ? 'Scanning Chats...' : 'Refresh Chats'}</span>
                  </button>
                )}
              </div>

              {/* Success Notification Banner */}
              {chatSuccessMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xs animate-in fade-in duration-200 border ${
                  darkMode ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{chatSuccessMessage}</span>
                </div>
              )}

              {/* Theme Preference Card in Settings */}
              <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${subCardBg}`}>
                <div className="flex items-center space-x-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
                    darkMode ? 'bg-amber-500 text-slate-950' : 'bg-indigo-600 text-white'
                  }`}>
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Application Theme ({darkMode ? 'Dark Mode Active' : 'Light Mode Active'})
                    </h3>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Toggle between rich dark mode and premium light mode. Preferences are saved automatically.
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs border shadow-xs transition flex items-center space-x-2 ${
                    darkMode
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 border-amber-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-500'
                  }`}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>Switch to {darkMode ? 'Light' : 'Dark'} Mode</span>
                </button>
              </div>

              {/* Current Active Destination Banner */}
              <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                darkMode ? 'bg-slate-900/90 border-sky-800/80' : 'bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border-sky-200/80'
              }`}>
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/25">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">Storage Destination for:</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        darkMode ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      }`}>
                        {activeWorkspace?.name || 'Default Workspace'} (ID #{activeWorkspace?.id || 1})
                      </span>
                    </div>
                    <p className={`text-base font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {storageChat === 'me' ? 'Self (Saved Messages)' : storageChat}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDashboardTab('workspaces')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Switch Workspace
                  </button>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs flex items-center space-x-1.5 ${
                    darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-white text-emerald-700 border-emerald-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Configured in MySQL</span>
                  </span>
                </div>
              </div>

              {/* Visual Chat Selection Grid */}
              {user?.is_bot ? (
                <div className={`p-6 rounded-3xl space-y-4 transition-colors duration-200 border ${
                  darkMode ? 'bg-slate-900 border-indigo-500/20' : 'bg-slate-50 border-indigo-200/50'
                }`}>
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Telegram Bot Storage Mode Active
                      </h4>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Telegram bots cannot fetch active chat dialogs automatically. Please specify your target storage channel or group ID below.
                      </p>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border text-xs space-y-4 ${subCardBg}`}>
                    <div className="space-y-3">
                      <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Storage Destination Channel / Chat ID
                      </label>
                      <input
                        type="text"
                        value={customChatId}
                        onChange={(e) => setCustomChatId(e.target.value)}
                        placeholder="e.g. -1001234567890 or @my_storage_channel"
                        className={`w-full rounded-xl px-4 py-2.5 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                      
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          disabled={testingConnection || !customChatId.trim()}
                          onClick={() => handleTestConnection(customChatId)}
                          className={`flex-1 px-5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer ${
                            darkMode 
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4 text-sky-400" />}
                          <span>{testingConnection ? 'Testing Connection...' : 'Test Connection'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={testingConnection || !customChatId.trim()}
                          onClick={() => handleCustomChatSubmit(undefined)}
                          className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-sky-500/10 flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Verify & Save Destination</span>
                        </button>
                      </div>
                    </div>

                    {/* Connection Test Results */}
                    {testConnectionResult && (
                      <div className={`p-4 rounded-xl text-xs flex flex-col gap-1 border animate-in fade-in duration-200 ${
                        testConnectionResult.success
                          ? (darkMode ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                          : (darkMode ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800')
                      }`}>
                        <div className="flex items-center space-x-2 font-bold">
                          {testConnectionResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          )}
                          <span>{testConnectionResult.success ? 'Success!' : 'Verification Failed'}</span>
                        </div>
                        <p className="leading-relaxed opacity-90">{testConnectionResult.message}</p>
                      </div>
                    )}

                    <div className={`text-[11px] leading-relaxed p-3.5 rounded-xl border ${
                      darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'
                    }`}>
                      <p className="font-semibold text-slate-300 mb-1">Requirements for Bot Storage Destination:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>The bot must be added as an <strong>Administrator</strong> to your group or channel.</li>
                        <li>The bot must have permissions to <strong>Post Messages</strong> and <strong>Edit Messages</strong>.</li>
                        <li>Channel IDs usually start with <code className="font-mono text-sky-400 font-bold">-100</code> (e.g. <code className="font-mono text-slate-400">-1002345678901</code>).</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Choose Destination Chat
                    </h3>
                    <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Click any destination to switch instantly</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OPTION 1: Self (Saved Messages) - Pinned First */}
                    <div
                      onClick={() => selectStorageDestination('me', 'Self (Saved Messages)')}
                      className={`cursor-pointer rounded-3xl p-5 border transition flex flex-col justify-between space-y-4 relative ${
                        storageChat === 'me'
                          ? (darkMode ? 'bg-sky-950/80 border-sky-500 ring-2 ring-sky-500/30' : 'bg-gradient-to-br from-sky-50 to-indigo-50/40 border-sky-400 ring-2 ring-sky-400/50 shadow-md')
                          : cardBg
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                            storageChat === 'me' ? 'bg-sky-500 text-white' : (darkMode ? 'bg-sky-950 text-sky-400' : 'bg-sky-100 text-sky-600')
                          }`}>
                            <UserCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Self (Saved Messages)</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                darkMode ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-100 text-sky-700 border-sky-200'
                              }`}>
                                Private & Default
                              </span>
                            </div>
                            <p className={`text-[11px] font-mono mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Destination ID: me</p>
                          </div>
                        </div>

                        {storageChat === 'me' && (
                          <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Your personal Telegram "Saved Messages" chat. 100% private to your account. Files uploaded here are permanently accessible and never shared with anyone.
                      </p>

                      <div className={`flex items-center justify-between pt-2 border-t text-xs ${darkMode ? 'border-slate-800' : 'border-slate-200/60'}`}>
                        <span className="font-bold text-sky-400">Recommended for personal vaults</span>
                        <span className={`font-extrabold ${storageChat === 'me' ? 'text-sky-400' : 'text-slate-400'}`}>
                          {storageChat === 'me' ? '● Currently Active' : 'Click to Select'}
                        </span>
                      </div>
                    </div>

                    {/* OTHER FETCHED CHATS FROM TELEGRAM DIALOGS */}
                    {availableChats
                      .filter((c) => c.id !== 'me')
                      .map((chat) => {
                        const isSelected = storageChat === chat.id;
                        return (
                          <div
                            key={chat.id}
                            onClick={() => selectStorageDestination(chat.id, chat.title)}
                            className={`cursor-pointer rounded-3xl p-5 border transition flex flex-col justify-between space-y-4 relative ${
                              isSelected
                                ? (darkMode ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 to-purple-50/40 border-indigo-400 ring-2 ring-indigo-400/50 shadow-md')
                                : cardBg
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                                  isSelected ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                                }`}>
                                  <Radio className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h4 className={`font-extrabold text-sm truncate max-w-[160px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                      {chat.title}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      darkMode ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    }`}>
                                      {chat.badge || 'Channel/Group'}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] font-mono mt-0.5 truncate ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                                    ID: {chat.id}
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              {chat.description || 'Files uploaded through TeleCloud will be stored in this chat/channel.'}
                            </p>

                            <div className={`flex items-center justify-between pt-2 border-t text-xs ${darkMode ? 'border-slate-800' : 'border-slate-200/60'}`}>
                              <span className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Storage Channel</span>
                              <span className={`font-extrabold ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {isSelected ? '● Currently Active' : 'Click to Select'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Custom Channel or Group ID Form */}
              {!user?.is_bot && (
                <div className={`p-6 rounded-3xl space-y-4 transition-colors duration-200 ${cardBg}`}>
                  <h4 className={`font-extrabold text-sm flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Layers className="w-4 h-4 text-sky-500" />
                    <span>Specify Custom Telegram Channel or Group ID</span>
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    If you manage a private channel or group not listed above, enter its ID (e.g. <code className="text-sky-400 font-mono font-bold">-1001234567890</code>) or public username. Ensure your Telegram account has admin rights.
                  </p>

                  <form onSubmit={handleCustomChatSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={customChatId}
                      onChange={(e) => setCustomChatId(e.target.value)}
                      placeholder="e.g. -1001234567890 or @my_storage_channel"
                      className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-mono ${inputBg}`}
                    />
                    <button
                      type="submit"
                      disabled={!customChatId.trim()}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply Destination</span>
                    </button>
                  </form>
                </div>
              )}

              {/* API Integrity & Developer Access Keys Card */}
              <div className={`p-6 rounded-3xl space-y-5 transition-colors duration-200 border ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                      darkMode ? 'bg-sky-950/80 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-600 border-sky-200'
                    }`}>
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          API Integrity & Developer Keys
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          API Integrity Active
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Upload files programmatically via REST API with your user API key & workspace ID, returning a direct <code className="text-sky-400 font-mono font-bold">file_url</code> in JSON.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestApiIntegrity}
                    disabled={verifyingApi || !userApiKey}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-xs flex items-center space-x-1.5 transition ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 text-emerald-400 ${verifyingApi ? 'animate-spin' : ''}`} />
                    <span>{verifyingApi ? 'Verifying...' : 'Verify API Integrity'}</span>
                  </button>
                </div>

                {/* API Key Box */}
                <div className={`p-4 rounded-2xl space-y-3 ${subCardBg}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      User API Key:
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Workspace ID: <strong className="text-sky-400">#{activeWorkspace?.id || 1}</strong> ({activeWorkspace?.name || 'Default'})
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        readOnly
                        value={userApiKey || 'Loading API key...'}
                        className={`w-full rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono select-all ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-bold rounded-lg ${
                          darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {showApiKey ? 'Hide' : 'Reveal'}
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(userApiKey, 'user-api-key')}
                        disabled={!userApiKey}
                        className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition flex-1 sm:flex-none justify-center"
                      >
                        {copiedId === 'user-api-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === 'user-api-key' ? 'Copied' : 'Copy Key'}</span>
                      </button>

                      <button
                        onClick={handleRegenerateApiKey}
                        disabled={regeneratingApiKey}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                          darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                        title="Regenerate a brand new API key"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingApiKey ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {verifyResult && (
                    <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 font-medium border ${
                      verifyResult.success
                        ? (darkMode ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                        : (darkMode ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800')
                    }`}>
                      {verifyResult.success ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                      <span>{verifyResult.message || verifyResult.error}</span>
                    </div>
                  )}

                  <div className={`pt-2.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Looking for the interactive Postman-style simulator and all endpoint specs?
                    </p>
                    <button
                      type="button"
                      onClick={() => setDashboardTab('api')}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Open API & Postman Simulator →</span>
                    </button>
                  </div>
                </div>

                {/* cURL Usage Documentation */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center space-x-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Terminal className="w-3.5 h-3.5 text-sky-400" />
                      <span>Direct File Upload with API Integrity (cURL Example):</span>
                    </span>
                    <button
                      onClick={() => {
                        const curlCmd = `curl -X POST "${window.location.origin}/api/v1/upload" \\\n  -H "x-api-key: ${userApiKey || 'YOUR_API_KEY'}" \\\n  -F "file=@/path/to/document.pdf" \\\n  -F "workspace_id=${activeWorkspace?.id || 1}" \\\n  -F "caption=Optional caption text"`;
                        copyToClipboard(curlCmd, 'curl-example');
                      }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                        darkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {copiedId === 'curl-example' ? 'Copied cURL' : 'Copy cURL'}
                    </button>
                  </div>

                  <pre className={`p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border ${
                    darkMode ? 'bg-slate-950 text-sky-300 border-slate-800' : 'bg-slate-900 text-sky-300 border-slate-800'
                  }`}>
{`# Upload file with API key & target workspace id
curl -X POST "${window.location.origin}/api/v1/upload" \\
  -H "x-api-key: ${userApiKey || 'YOUR_API_KEY'}" \\
  -F "file=@/path/to/document.pdf" \\
  -F "workspace_id=${activeWorkspace?.id || 1}" \\
  -F "caption=Optional caption text"`}
                  </pre>

                  <div className="text-[11px] space-y-1">
                    <p className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      JSON Direct Response Format (returns <code className="text-emerald-400 font-bold font-mono">file_url</code>):
                    </p>
                    <pre className={`p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border ${
                      darkMode ? 'bg-slate-950/70 text-slate-300 border-slate-800' : 'bg-slate-900 text-slate-200 border-slate-800'
                    }`}>
{`{
  "success": true,
  "file_url": "${window.location.origin}/api/download/305452/document.pdf",
  "direct_link": "${window.location.origin}/api/download/305452/document.pdf",
  "message_id": 305452,
  "file_name": "document.pdf",
  "file_size": 1048576,
  "mime_type": "application/pdf",
  "workspace_id": ${activeWorkspace?.id || 1},
  "workspace_name": "${activeWorkspace?.name || 'Default Workspace'}",
  "caption": "Optional caption text",
  "checksum_sha256": "b9374bcceca3d1413fa6a958e67725c96157f290da65ab9267b48c95b8f9613f"
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Telegram Session Device Identity & Login Location Card */}
              <div className={`p-6 rounded-3xl space-y-6 transition-colors duration-200 border ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                      darkMode ? 'bg-indigo-950/80 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    }`}>
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Telegram Device & Location Identity
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          darkMode ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          Custom MTProto Identity
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Configure how your sessions appear on your phone inside <strong>Telegram → Settings → Devices</strong> (no generic "PC 64bit").
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveDeviceConfig}
                    disabled={savingDeviceConfig}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center space-x-1.5 transition active:scale-95 shrink-0 self-start sm:self-auto"
                  >
                    {savingDeviceConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{savingDeviceConfig ? 'Saving...' : 'Save Device Identity'}</span>
                  </button>
                </div>

                {deviceSuccessMsg && (
                  <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xs border animate-in fade-in duration-200 ${
                    darkMode ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{deviceSuccessMsg}</span>
                  </div>
                )}

                {/* 1-Click Device Presets */}
                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    1-Click Device Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {DEVICE_PRESETS.map((preset) => {
                      const isSelected = deviceModel === preset.device;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setDeviceModel(preset.device);
                            setSystemVersion(preset.system);
                            setDeviceAppVersion(preset.app);
                          }}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 relative active:scale-95 ${
                            isSelected
                              ? (darkMode ? 'bg-sky-500/15 border-sky-500/60 ring-1 ring-sky-500/40 text-white' : 'bg-sky-50 border-sky-400 ring-1 ring-sky-400 text-slate-900')
                              : (darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700')
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">
                              {preset.icon === 'laptop' ? '💻' : preset.icon === 'smartphone' ? '📱' : '🚀'}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-sky-400/30" />
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-xs truncate">{preset.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{preset.device}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Device Identity Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Device Model Name
                    </label>
                    <input
                      type="text"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      placeholder="e.g. MacBook Pro 16 or TeleCloud Vault"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono ${inputBg}`}
                    />
                    <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Replaces "PC 64bit" in your Telegram Devices list.
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      System Version / OS
                    </label>
                    <input
                      type="text"
                      value={systemVersion}
                      onChange={(e) => setSystemVersion(e.target.value)}
                      placeholder="e.g. macOS Sonoma 14.5 or Windows 11"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono ${inputBg}`}
                    />
                    <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      OS version displayed below the device title.
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      App Name & Version
                    </label>
                    <input
                      type="text"
                      value={deviceAppVersion}
                      onChange={(e) => setDeviceAppVersion(e.target.value)}
                      placeholder="e.g. TeleCloud Vault v1.5.1"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono ${inputBg}`}
                    />
                    <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Client application build signature.
                    </p>
                  </div>
                </div>

                {/* Login Location & Egress Network Information */}
                <div className={`p-4 rounded-2xl border space-y-3 ${subCardBg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className={`text-xs font-extrabold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          Login Geo-Location & Public Egress IP
                        </h5>
                        <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Current server network location: <strong className="text-sky-400">{serverLocation?.city || 'Cloud Datacenter'}, {serverLocation?.country || 'Global'}</strong> ({serverLocation?.ip || 'Detecting...'}) {serverLocation?.org ? `• ${serverLocation.org}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Telegram calculates the location in your Devices list from the public IP connecting to MTProto servers. If you want your Telegram Active Session to appear in a specific country (e.g. United States, Germany, Singapore), enter an optional SOCKS5 or HTTP proxy below:
                  </p>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Optional Proxy URL for Custom IP / Location (SOCKS5 / HTTP)
                    </label>
                    <input
                      type="text"
                      value={proxyUrl}
                      onChange={(e) => setProxyUrl(e.target.value)}
                      placeholder="e.g. socks5://username:password@104.28.12.34:1080 or http://proxy.host:8080"
                      className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono ${inputBg}`}
                    />
                  </div>
                </div>

                {/* Live Telegram Active Session Preview */}
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100/90 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Live Preview: How It Looks in Your Phone's Telegram App (Settings → Devices)
                  </span>
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {deviceModel.toLowerCase().includes('phone') ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-extrabold text-xs">{deviceModel || 'TeleCloud Vault'}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            Active
                          </span>
                        </div>
                        <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {deviceAppVersion || 'TeleCloud Vault v1.5.1'}, {systemVersion || 'macOS Sonoma 14.5'}
                        </p>
                        <p className={`text-[10px] font-mono ${darkMode ? 'text-sky-300' : 'text-sky-600'}`}>
                          📍 {serverLocation?.city || 'Cloud'}, {serverLocation?.country || 'Global'} • {serverLocation?.ip || 'Server IP'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400 font-mono">online</span>
                  </div>
                </div>
              </div>

              {/* Connected Telegram Profile & Sign Out */}
              <div className={`p-6 rounded-3xl space-y-4 transition-colors duration-200 ${cardBg}`}>
                <h4 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Connected Telegram Account</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-3.5 rounded-2xl ${subCardBg}`}>
                    <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>User Name</span>
                    <p className={`font-bold text-xs mt-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{user?.first_name} {user?.last_name || ''}</p>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${subCardBg}`}>
                    <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Telegram ID</span>
                    <p className={`font-mono font-bold text-xs mt-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{user?.id}</p>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${subCardBg}`}>
                    <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Username</span>
                    <p className="font-bold text-xs text-sky-400 mt-0.5">@{user?.username || 'none'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDisconnect}
                    className={`w-full py-3 rounded-2xl font-bold text-xs border shadow-xs transition flex items-center justify-center space-x-2 ${
                      darkMode ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800/80' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out & Disconnect Telegram Session</span>
                  </button>
                </div>

                {/* Danger Zone: Permanent Deletion */}
                <div className="pt-4 border-t border-rose-900/20 dark:border-rose-800/20 space-y-4">
                  <div className="flex items-center space-x-2 text-rose-500 font-extrabold text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <span>Danger Zone: Permanent Account Deletion</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Delete your profile and completely purge your active sessions, workspaces, and catalog history from our cloud platform.
                  </p>

                  {!showDeleteConfirmation ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirmation(true)}
                      className={`w-full py-3 rounded-2xl font-bold text-xs border shadow-xs transition flex items-center justify-center space-x-2 ${
                        darkMode ? 'bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border-rose-800/40' : 'bg-red-50 hover:bg-red-100/80 text-red-600 border-red-200'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Delete System Account</span>
                    </button>
                  ) : (
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                      darkMode ? 'bg-rose-950/15 border-rose-900/40' : 'bg-red-50/50 border-red-200/60'
                    }`}>
                      <div className="space-y-2 text-xs">
                        <p className="font-extrabold text-rose-500 flex items-center gap-1.5">
                          ⚠️ WARNING: THIS IS IRREVERSIBLE
                        </p>
                        <p className={`leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Proceeding will permanently delete the following assets from our servers:
                        </p>
                        <ul className={`list-disc list-inside space-y-1 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          <li>Your user profile record and cloud authentication keys</li>
                          <li>All of your workspaces (e.g. <strong>{workspaces.map(w => w.name).join(', ') || 'Default'}</strong>)</li>
                          <li>Database index of all your files (<strong>{files.length}</strong> catalog records)</li>
                          <li>Your programmatically generated API keys</li>
                        </ul>
                      </div>

                      {/* PHYSICAL TELEGRAM FILES REMOVAL OPTION */}
                      <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-950/80' : 'bg-white border-slate-200 hover:bg-slate-100/50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={deleteTelegramFiles}
                          onChange={(e) => setDeleteTelegramFiles(e.target.checked)}
                          className="mt-0.5 rounded text-rose-500 focus:ring-rose-500"
                        />
                        <div className="text-[11px] leading-relaxed">
                          <span className={`font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            Also Delete All Original Files from Telegram Chat Storage
                          </span>
                          <span className={`text-[10px] block mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Checking this will instruct the MTProto engine to request Telegram to permanently delete all messages/files uploaded through this app from your storage chat (ID: {storageChat}). If unchecked, files are kept in your Telegram chat but purged from this app.
                          </span>
                        </div>
                      </label>

                      {/* TEXT VERIFICATION TO PREVENT ACCIDENTAL CLICKS */}
                      <div className="space-y-1.5">
                        <label className={`block text-[11px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Type <span className="text-rose-500 font-mono font-bold">DELETE</span> to confirm permanent deletion:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmationText}
                          onChange={(e) => setDeleteConfirmationText(e.target.value)}
                          placeholder="Type DELETE here..."
                          className={`w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none ${
                            darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirmation(false);
                            setDeleteConfirmationText('');
                            setDeleteTelegramFiles(false);
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                            darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={deletingAccount || deleteConfirmationText.toUpperCase() !== 'DELETE'}
                          onClick={handleDeleteAccount}
                          className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 active:scale-95 shadow-md shadow-rose-600/20"
                        >
                          {deletingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          <span>{deletingAccount ? 'Purging Records...' : 'Permanently Delete My Account'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: API CONSOLE & POSTMAN SIMULATOR */}
          {dashboardTab === 'api' && (
            <ApiConsolePage
              darkMode={darkMode}
              cardBg={cardBg}
              subCardBg={subCardBg}
              inputBg={inputBg}
              user={user}
              userApiKey={userApiKey}
              activeWorkspace={activeWorkspace}
              workspaces={workspaces}
              onRegenerateApiKey={handleRegenerateApiKey}
              regeneratingApiKey={regeneratingApiKey}
              onCopy={copyToClipboard}
              copiedId={copiedId}
              onRefreshFiles={fetchFiles}
              onRefreshWorkspaces={fetchWorkspaces}
              onRefreshStats={fetchStats}
            />
          )}
        </main>
      </div>

      {/* RENAME FILE MODAL */}
      {editingFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 transition-colors duration-200 ${modalBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-sky-950/80 text-sky-400 border border-sky-800' : 'bg-sky-100 text-sky-600'}`}>
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Rename Cloud File</h3>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Updates file name in your cloud catalog</p>
                </div>
              </div>
              <button
                onClick={() => setEditingFile(null)}
                className={`p-1.5 rounded-lg transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  New File Name
                </label>
                <input
                  type="text"
                  required
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono ${inputBg}`}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renamingLoading || !newFileNameInput.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold hover:from-sky-400 hover:to-indigo-500 shadow-xs flex items-center space-x-1.5"
                >
                  {renamingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WORKSPACE MODAL */}
      {createWorkspaceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 transition-colors duration-200 ${modalBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-sky-950/80 text-sky-400 border border-sky-800' : 'bg-sky-100 text-sky-600'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Create New Workspace</h3>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Connected to Telegram Account #{user?.id}</p>
                </div>
              </div>
              <button
                onClick={() => setCreateWorkspaceModalOpen(false)}
                className={`p-1.5 rounded-lg transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Production Archive, Personal Vault, Channel Media"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Storage Destination for this Workspace
                </label>
                <p className={`text-[10px] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  Each workspace can save to 'me' (Saved Messages) or a specific Telegram channel/chat.
                </p>
                <div className="space-y-2">
                  <select
                    value={newWorkspaceStorageChat}
                    onChange={(e) => setNewWorkspaceStorageChat(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold ${inputBg}`}
                  >
                    <option value="me">Self (Saved Messages) — Private to you</option>
                    {availableChats.filter((c) => c.id !== 'me').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (ID: {c.id})
                      </option>
                    ))}
                    <option value="custom">Enter Custom Chat / Channel ID...</option>
                  </select>

                  {newWorkspaceStorageChat === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g. -1001234567890 or @my_channel"
                      onChange={(e) => setNewWorkspaceStorageChat(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateWorkspaceModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWorkspace || !newWorkspaceName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold hover:from-sky-400 hover:to-indigo-500 shadow-xs flex items-center space-x-1.5"
                >
                  {creatingWorkspace && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WORKSPACE MODAL */}
      {editingWorkspace && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 transition-colors duration-200 ${modalBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800' : 'bg-indigo-100 text-indigo-600'}`}>
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Edit Workspace Settings</h3>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configure name & storage destination in MySQL</p>
                </div>
              </div>
              <button
                onClick={() => setEditingWorkspace(null)}
                className={`p-1.5 rounded-lg transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={editWorkspaceName}
                  onChange={(e) => setEditWorkspaceName(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Storage Destination (Telegram Chat / Channel)
                </label>
                <div className="space-y-2">
                  <select
                    value={editWorkspaceStorageChat}
                    onChange={(e) => setEditWorkspaceStorageChat(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold ${inputBg}`}
                  >
                    <option value="me">Self (Saved Messages) — Private to you</option>
                    {availableChats.filter((c) => c.id !== 'me').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (ID: {c.id})
                      </option>
                    ))}
                    <option value="custom">Custom ID / Channel</option>
                  </select>

                  <input
                    type="text"
                    value={editWorkspaceStorageChat}
                    onChange={(e) => setEditWorkspaceStorageChat(e.target.value)}
                    placeholder="e.g. me or -1001234567890"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWorkspace(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWorkspace || !editWorkspaceName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold hover:from-sky-400 hover:to-indigo-500 shadow-xs flex items-center space-x-1.5"
                >
                  {savingWorkspace && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN FILE WORKSPACE MODAL */}
      {reassignFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 transition-colors duration-200 ${modalBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800' : 'bg-indigo-100 text-indigo-600'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Move File to Workspace</h3>
                  <p className={`text-[11px] truncate max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{reassignFileModal.file_name}</p>
                </div>
              </div>
              <button
                onClick={() => setReassignFileModal(null)}
                className={`p-1.5 rounded-lg transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                ✕
              </button>
            </div>

            <div className={`p-3 rounded-2xl text-xs space-y-1 ${subCardBg}`}>
              <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Current Workspace:</p>
              <p className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {reassignFileModal.workspace_name || activeWorkspace?.name || 'Default Workspace'}{' '}
                {reassignFileModal.workspace_id ? `(ID #${reassignFileModal.workspace_id})` : ''}
              </p>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Select Destination Workspace:
              </label>
              <select
                value={reassignTargetWorkspaceId || ''}
                onChange={(e) => setReassignTargetWorkspaceId(Number(e.target.value))}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold ${inputBg}`}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (ID #{w.id}) {w.id === activeWorkspaceId ? '• Active' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReassignFileModal(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reassigningFile || !reassignTargetWorkspaceId}
                onClick={handleReassignFileWorkspace}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold hover:from-sky-400 hover:to-indigo-500 shadow-xs flex items-center space-x-1.5"
              >
                {reassigningFile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Move File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Link / File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-xl w-full p-7 shadow-2xl relative space-y-5 transition-colors duration-200 ${modalBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  darkMode ? 'bg-sky-950/80 text-sky-400 border-sky-800' : 'bg-sky-500/10 border-sky-500/20 text-sky-600'
                }`}>
                  {getFileIcon(previewFile.mime_type, previewFile.file_name)}
                </div>
                <div className="min-w-0 max-w-sm">
                  <h3 className={`text-base font-extrabold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{previewFile.file_name}</h3>
                  <p className={`text-xs font-mono font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatBytes(previewFile.file_size)} • Msg #{previewFile.message_id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewFile(null)}
                className={`p-2 rounded-xl transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                ✕
              </button>
            </div>

            {previewFile.mime_type?.startsWith('video/') && (
              <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center shadow-inner">
                <video controls src={previewFile.direct_link} className="w-full h-full object-contain">
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>
            )}

            {previewFile.mime_type?.startsWith('image/') && (
              <div className={`rounded-2xl overflow-hidden max-h-64 flex items-center justify-center p-2 border shadow-inner ${
                darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <img src={previewFile.direct_link} alt={previewFile.file_name} className="max-h-60 max-w-full object-contain rounded-xl" />
              </div>
            )}

            {previewFile.mime_type?.startsWith('audio/') && (
              <div className={`p-4 rounded-2xl ${subCardBg}`}>
                <audio controls src={previewFile.direct_link} className="w-full">
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            <div className={`p-4 rounded-2xl space-y-3.5 ${subCardBg}`}>
              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Direct Stream & Download URL:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={previewFile.direct_link || ''}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono text-sky-400 select-all ${inputBg}`}
                  />
                  <button
                    onClick={() => copyToClipboard(previewFile.direct_link || '', 'modal-direct')}
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1"
                  >
                    {copiedId === 'modal-direct' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'modal-direct' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => setQrModalFile(previewFile)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1 transition"
                    title="Generate QR code for mobile scanning"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <a
                href={previewFile.direct_link}
                download={previewFile.file_name}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
              <button
                onClick={() => setPreviewFile(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-xs ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT LINK QR CODE GENERATION & SCANNING MODAL */}
      {qrModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 transition-colors duration-200 border ${modalBg}`}>
            <div className={`flex items-center justify-between border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 ${
                  darkMode ? 'bg-amber-950/80 text-amber-400 border-amber-800/80' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-base font-extrabold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Mobile QR Code
                  </h3>
                  <p className={`text-xs font-mono font-medium truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {qrModalFile.file_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setQrModalFile(null)}
                className={`p-2 rounded-xl transition flex-shrink-0 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                aria-label="Close QR Modal"
              >
                ✕
              </button>
            </div>

            {/* Scannable Card with White Background Frame for High-Contrast Scanning */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xl border-4 border-white ring-1 ring-slate-200 flex flex-col items-center justify-center">
                {qrLoading ? (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-xs font-bold text-slate-600">Generating direct link QR...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${qrModalFile.file_name}`}
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-xs text-rose-500 font-bold">
                    Unable to generate QR code
                  </div>
                )}
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-mono font-extrabold text-slate-700 uppercase tracking-wider">
                    {formatBytes(qrModalFile.file_size)} • {qrModalFile.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                </div>
              </div>

              <p className={`text-xs text-center max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Scan with your phone's camera or Telegram scanner to open, preview, or download this file directly on mobile.
              </p>
            </div>

            {/* Direct URL Display & 1-Click Copy */}
            <div className={`p-3.5 rounded-2xl space-y-2 ${subCardBg}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Direct Target Link:</span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">Public Stream Link</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={
                    qrModalFile.direct_link?.startsWith('http')
                      ? qrModalFile.direct_link
                      : `${window.location.origin}${qrModalFile.direct_link || `/api/download/${qrModalFile.message_id}/${encodeURIComponent(qrModalFile.file_name)}`}`
                  }
                  className={`w-full rounded-xl px-3 py-2 text-xs font-mono text-sky-400 select-all ${inputBg}`}
                />
                <button
                  onClick={() => {
                    const link = qrModalFile.direct_link?.startsWith('http')
                      ? qrModalFile.direct_link
                      : `${window.location.origin}${qrModalFile.direct_link || `/api/download/${qrModalFile.message_id}/${encodeURIComponent(qrModalFile.file_name)}`}`;
                    copyToClipboard(link, 'qr-modal-link');
                  }}
                  className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1 flex-shrink-0"
                >
                  {copiedId === 'qr-modal-link' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'qr-modal-link' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`${qrModalFile.file_name.replace(/[^a-zA-Z0-9_.-]/g, '_')}-qrcode.png`}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition flex-1 justify-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </a>
              )}
              <a
                href={
                  qrModalFile.direct_link?.startsWith('http')
                    ? qrModalFile.direct_link
                    : `${window.location.origin}${qrModalFile.direct_link || `/api/download/${qrModalFile.message_id}/${encodeURIComponent(qrModalFile.file_name)}`}`
                }
                target="_blank"
                rel="noreferrer"
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1 ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <LinkExternal className="w-3.5 h-3.5" />
                <span>Open Link</span>
              </a>
              <button
                onClick={() => setQrModalFile(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-xs ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARED FILES MANIFEST MODAL */}
      {manifestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[90vh] flex flex-col transition-colors duration-200 ${modalBg}`}>
            <div className={`flex items-center justify-between border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Shared Files Manifest Link</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedFileIds.length} files bundled • Total {formatBytes(selectedTotalBytes)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setManifestModalOpen(false)}
                className={`p-2 rounded-xl transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                ✕
              </button>
            </div>

            {/* Manifest Single Link Box */}
            <div className={`p-4 rounded-2xl space-y-2 ${subCardBg}`}>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center space-x-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Single Shared Manifest URL:</span>
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  Direct API & JSON Ready
                </span>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/manifest?ids=${selectedFileIds.join(',')}`}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono text-sky-400 select-all ${inputBg}`}
                />
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}/api/manifest?ids=${selectedFileIds.join(',')}`,
                      'manifest-url'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition active:scale-95"
                >
                  {copiedId === 'manifest-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'manifest-url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/manifest?ids=${selectedFileIds.join(',')}&download=1`}
                download="telecloud-manifest.json"
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold shadow-xs flex items-center space-x-1.5 transition ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download Manifest (.json)</span>
              </a>

              <a
                href={`/api/manifest?ids=${selectedFileIds.join(',')}&format=m3u`}
                download="telecloud-playlist.m3u"
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold shadow-xs flex items-center space-x-1.5 transition ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Streaming Playlist (.m3u)</span>
              </a>

              <button
                onClick={() => {
                  const allLinks = selectedFiles
                    .map((f) => f.direct_link || `${window.location.origin}/api/download/${f.message_id}/${encodeURIComponent(f.file_name)}`)
                    .join('\n');
                  copyToClipboard(allLinks, 'all-direct-links');
                }}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold shadow-xs flex items-center space-x-1.5 transition ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {copiedId === 'all-direct-links' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedId === 'all-direct-links' ? 'Copied All Links' : 'Copy All Direct Links'}</span>
              </button>
            </div>

            {/* Selected Files List in Manifest */}
            <div className={`flex-1 overflow-y-auto min-h-[140px] max-h-[300px] border rounded-2xl divide-y ${
              darkMode ? 'border-slate-800 divide-slate-800 bg-slate-950/60' : 'border-slate-100 divide-slate-100 bg-slate-50/50'
            }`}>
              {selectedFiles.map((file) => (
                <div key={file.message_id} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-sky-400' : 'bg-white border-slate-200'
                    }`}>
                      {getFileIcon(file.mime_type, file.file_name)}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold truncate max-w-[220px] sm:max-w-md ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{file.file_name}</p>
                      <p className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>{formatBytes(file.file_size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          file.direct_link || `${window.location.origin}/api/download/${file.message_id}/${encodeURIComponent(file.file_name)}`,
                          `manifest-item-${file.message_id}`
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 shadow-xs transition ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {copiedId === `manifest-item-${file.message_id}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === `manifest-item-${file.message_id}` ? 'Copied' : 'Link'}</span>
                    </button>
                    <a
                      href={file.direct_link}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-1.5 rounded-lg border shadow-xs transition ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className={`flex items-center justify-between pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                Anyone with this manifest link can inspect or download the included items.
              </span>
              <button
                onClick={() => setManifestModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar for Native-App Touch UX */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around py-1.5 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-2xl font-sans font-medium transition-colors duration-200 ${
        darkMode ? 'bg-slate-900/95 backdrop-blur-xl border-slate-800 text-slate-400' : 'bg-white/95 backdrop-blur-xl border-slate-200/80 text-slate-500'
      }`}>
        <button
          type="button"
          onClick={() => { setDashboardTab('overview'); setMobileSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            dashboardTab === 'overview' ? 'text-indigo-400 font-extrabold' : (darkMode ? 'hover:text-white' : 'hover:text-slate-900')
          }`}
          aria-label="Overview tab"
        >
          <BarChart3 className={`w-4 h-4 mb-0.5 ${dashboardTab === 'overview' ? 'text-indigo-400' : 'text-slate-400'}`} />
          <span className="text-[10px]">Overview</span>
        </button>

        <button
          type="button"
          onClick={() => { setDashboardTab('workspaces'); setMobileSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative cursor-pointer ${
            dashboardTab === 'workspaces' ? 'text-purple-400 font-extrabold' : (darkMode ? 'hover:text-white' : 'hover:text-slate-900')
          }`}
          aria-label="Workspaces tab"
        >
          <Layers className={`w-4 h-4 mb-0.5 ${dashboardTab === 'workspaces' ? 'text-purple-400' : 'text-slate-400'}`} />
          <span className="text-[10px]">Workspaces</span>
          {workspaces.length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-purple-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => { setDashboardTab('upload'); setMobileSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            dashboardTab === 'upload' ? 'text-sky-400 font-extrabold' : (darkMode ? 'hover:text-white' : 'hover:text-slate-900')
          }`}
          aria-label="Upload tab"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center -mt-3 shadow-md shadow-sky-500/30">
            <UploadCloud className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Upload</span>
        </button>

        <button
          type="button"
          onClick={() => { setDashboardTab('vault'); setMobileSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            dashboardTab === 'vault' ? 'text-emerald-400 font-extrabold' : (darkMode ? 'hover:text-white' : 'hover:text-slate-900')
          }`}
          aria-label="Files Vault tab"
        >
          <HardDrive className={`w-4 h-4 mb-0.5 ${dashboardTab === 'vault' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[10px]">Vault</span>
        </button>

        <button
          type="button"
          onClick={() => { setDashboardTab('settings'); setMobileSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            dashboardTab === 'settings' ? 'text-teal-400 font-extrabold' : (darkMode ? 'hover:text-white' : 'hover:text-slate-900')
          }`}
          aria-label="Storage Settings tab"
        >
          <Sliders className={`w-4 h-4 mb-0.5 ${dashboardTab === 'settings' ? 'text-teal-400' : 'text-slate-400'}`} />
          <span className="text-[10px]">Storage</span>
        </button>
      </nav>

      {/* RENDER AUTH MODAL */}
      {renderAuthModal()}

      {/* RENDER SESSION BACKUP / EXPORT MODAL */}
      {renderSessionExportModal()}

      {/* RENDER CLEANUP & PURGE CONFIRMATION MODAL */}
      {renderCleanupModal()}
    </div>
  );

  function renderDatabaseErrorScreen() {
    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl ${
        darkMode ? 'bg-slate-950/95 text-slate-100' : 'bg-slate-900/95 text-slate-100'
      }`}>
        <div className="max-w-lg w-full p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 shadow-2xl relative space-y-6 text-center antialiased">
          {/* Pulsing Warning Icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-3xl bg-rose-950 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50">
              <Database className="w-10 h-10 animate-bounce text-rose-400" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Database Connection Failure</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              MySQL Database Error
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Application execution is halted because the MySQL database is unreachable.
            </p>
          </div>

          {/* Database Error Details Card */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-rose-900/40 text-left space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
              <span className="text-slate-400 font-sans font-bold">Error Message:</span>
              <span className="text-rose-400 font-bold uppercase tracking-wide">Connection Failed</span>
            </div>
            <p className="text-rose-300 break-all text-[11px] leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/30">
              {dbError || 'Failed to establish connection to target MySQL server.'}
            </p>

            {dbStatusDetails && (
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 font-sans">
                <div>
                  <span className="text-slate-500 block">Database Host:</span>
                  <span className="font-mono text-slate-200 font-semibold">{dbStatusDetails.host || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Port:</span>
                  <span className="font-mono text-slate-200 font-semibold">{dbStatusDetails.port || 3306}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Database Name:</span>
                  <span className="font-mono text-slate-200 font-semibold">{dbStatusDetails.database || 'telecloud'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">User:</span>
                  <span className="font-mono text-slate-200 font-semibold">{dbStatusDetails.user || 'root'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Silent Background Polling Indicator & Manual Action */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center space-x-2 text-xs text-sky-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Silently checking MySQL connection in background...</span>
            </div>

            <button
              onClick={() => checkDbStatus()}
              disabled={checkingDb}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-extrabold text-xs transition shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {checkingDb ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Database className="w-4 h-4 text-white" />
              )}
              <span>{checkingDb ? 'Testing Connection...' : 'Retry Connection Now'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderAppLockScreen() {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className={`absolute -top-40 -left-40 w-[30rem] h-[30rem] rounded-full blur-[140px] ${darkMode ? 'bg-indigo-950/30' : 'bg-indigo-100/60'}`} />
          <div className={`absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full blur-[140px] ${darkMode ? 'bg-sky-950/25' : 'bg-sky-100/50'}`} />
        </div>

        <div className={`max-w-md w-full rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl border transition-all duration-300 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 shadow-indigo-950/50' : 'bg-white/95 border-slate-200 shadow-slate-200/80'
        } ${appLockShaking ? 'animate-bounce' : ''}`}>
          
          {/* Header & Lock Icon */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Lock className="w-8 h-8" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 border-2 border-slate-900">
                PIN
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {publicBranding.brand_name || 'TeleCloud Vault'}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-md">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                Enter the Dashboard PIN configured in your <span className="font-mono text-sky-400">.env</span> file to access the web GUI.
              </p>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>App Lock Active (.env Protected)</span>
            </div>
          </div>

          {/* PIN Form */}
          <form onSubmit={handleUnlockApp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Security PIN
              </label>
              <div className="relative">
                <input
                  type={showAppLockPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={appLockPin}
                  onChange={(e) => {
                    setAppLockPin(e.target.value);
                    if (appLockError) setAppLockError('');
                  }}
                  placeholder="Enter Dashboard PIN"
                  autoFocus
                  className={`w-full px-4 py-3 rounded-2xl font-mono text-lg tracking-widest text-center border transition focus:outline-none focus:ring-2 ${
                    appLockError
                      ? 'border-rose-500 focus:ring-rose-500/20 bg-rose-500/5'
                      : darkMode
                      ? 'bg-slate-950/70 border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 text-white placeholder-slate-600'
                      : 'bg-slate-50 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowAppLockPin(!showAppLockPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition"
                  title={showAppLockPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showAppLockPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {appLockError && (
                <p className="text-xs text-rose-500 font-semibold flex items-center justify-center space-x-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{appLockError}</span>
                </p>
              )}
            </div>

            {/* Quick Numeric Keypad for fast touch/click entry */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAppLockPin((prev) => prev + num)}
                  className={`py-2.5 rounded-xl font-mono font-bold text-base transition active:scale-95 border cursor-pointer ${
                    darkMode
                      ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAppLockPin('')}
                className={`py-2.5 rounded-xl text-xs font-bold transition active:scale-95 border cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    : 'bg-slate-100/70 hover:bg-slate-200 border-slate-200 text-slate-500'
                }`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setAppLockPin((prev) => prev + '0')}
                className={`py-2.5 rounded-xl font-mono font-bold text-base transition active:scale-95 border cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800'
                }`}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setAppLockPin((prev) => prev.slice(0, -1))}
                className={`py-2.5 rounded-xl text-xs font-bold transition active:scale-95 border cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    : 'bg-slate-100/70 hover:bg-slate-200 border-slate-200 text-slate-500'
                }`}
              >
                ⌫ Back
              </button>
            </div>

            {/* Remember Session Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberLockSession}
                  onChange={(e) => setRememberLockSession(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>Remember on this browser</span>
              </label>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="text-slate-400 hover:text-slate-200 transition text-[11px] cursor-pointer"
              >
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={appLockLoading || !appLockPin}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center space-x-2 active:scale-98 ${
                appLockLoading || !appLockPin
                  ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-indigo-500/25 cursor-pointer'
              }`}
            >
              {appLockLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Public File Serving Notice */}
          <div className={`mt-6 pt-4 border-t text-center space-y-1.5 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Public File Streaming & CDN Links Active</span>
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Direct shortlinks (<span className="font-mono text-slate-300">/f/:slug</span>) and API streaming downloads continue to serve files worldwide without requiring PIN authentication.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderCleanupModal() {
    if (!cleanupModalRule) return null;

    let targetCount = 0;
    let targetBytes = 0;
    let ruleTitle = '';
    let ruleDescription = '';

    if (cleanupModalRule === 'custom') {
      targetCount = selectedAnalyticsFileIds.length;
      const targetSet = new Set(selectedAnalyticsFileIds);
      const selectedFiles = analyticsFiles.filter((f) => targetSet.has(String(f.id)) || targetSet.has(String(f.message_id)));
      targetBytes = selectedFiles.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0);
      ruleTitle = `Purge Selected Files (${targetCount})`;
      ruleDescription = `You have selected ${targetCount} file(s) for permanent removal from your catalog and Telegram chat.`;
    } else if (cleanupModalRule === 'not_accessed_7_days') {
      targetCount = analyticsStats?.unaccessed7DaysCount || 0;
      targetBytes = analyticsStats?.unaccessed7DaysBytes || 0;
      ruleTitle = 'Purge Unaccessed Files (> 7 Days)';
      ruleDescription = 'Permanently delete files that have not been served or accessed in the last 7 days (or never served).';
    } else if (cleanupModalRule === 'not_accessed_30_days') {
      targetCount = analyticsStats?.unaccessed30DaysCount || 0;
      targetBytes = analyticsStats?.unaccessed30DaysBytes || 0;
      ruleTitle = 'Purge Dormant Files (> 30 Days)';
      ruleDescription = 'Permanently delete old dormant files that have not been accessed in over 30 days.';
    } else if (cleanupModalRule === 'never_accessed') {
      targetCount = analyticsStats?.neverAccessedCount || 0;
      targetBytes = analyticsStats?.neverAccessedBytes || 0;
      ruleTitle = 'Purge Never Accessed Files (Since Start)';
      ruleDescription = 'Permanently delete files that have 0 total serves since upload.';
    }

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">{ruleTitle}</h3>
                <p className="text-xs text-slate-400">Automated Storage Reclaim</p>
              </div>
            </div>
            <button
              onClick={() => setCleanupModalRule(null)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}
            >
              ✕
            </button>
          </div>

          <div className={`p-4 rounded-2xl border space-y-3 ${
            darkMode ? 'bg-slate-950/60 border-slate-800 text-xs' : 'bg-slate-50 border-slate-200 text-xs'
          }`}>
            <p className="text-slate-300 leading-relaxed">{ruleDescription}</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-mono">
              <span className="text-slate-400">Files to be purged:</span>
              <span className="font-bold text-rose-400 text-sm">{targetCount} files</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-400">Storage space reclaimed:</span>
              <span className="font-bold text-emerald-400 text-sm">{formatBytes(targetBytes)}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Warning</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              This action will permanently delete these files from your MySQL catalog and Telegram MTProto cloud storage. This cannot be undone.
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setCleanupModalRule(null)}
              className={`flex-1 py-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteCleanup}
              disabled={isCleaningUp || targetCount === 0}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isCleaningUp ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{isCleaningUp ? 'Purging...' : 'Confirm Purge'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderSessionExportModal() {
    if (!showSessionExportModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                <FileKey className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Session Backup & Quick Key</h3>
                <p className="text-xs text-slate-400">Passwordless sign-in file for your vault</p>
              </div>
            </div>
            <button
              onClick={() => setShowSessionExportModal(false)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}
            >
              ✕
            </button>
          </div>

          <div className={`p-4 rounded-2xl border space-y-2.5 ${
            darkMode ? 'bg-slate-950/60 border-slate-800 text-xs' : 'bg-slate-50 border-slate-200 text-xs'
          }`}>
            <div className="flex justify-between items-center text-slate-400">
              <span>Account:</span>
              <span className="font-bold text-slate-200">{user?.first_name} {user?.last_name || ''}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Telegram ID:</span>
              <span className="font-mono text-slate-200">#{user?.id}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Username:</span>
              <span className="font-mono text-sky-400">{user?.username ? `@${user.username}` : 'None'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>How This Works</span>
            </p>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              Download your <strong>.telecloud</strong> session file and keep it secure. When you sign in later, simply upload or drag-and-drop this file to enter instantly without waiting for an SMS or scanning a QR code!
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDownloadRawSession('session')}
                disabled={exportingSession}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-950 shrink-0" />
                <span>Download .session</span>
              </button>

              <button
                onClick={() => handleDownloadRawSession('txt')}
                disabled={exportingSession}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Download .txt String</span>
              </button>
            </div>

            <button
              onClick={handleDownloadSessionFile}
              disabled={exportingSession}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                darkMode ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/30' : 'bg-amber-50/80 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Download Backup File (.telecloud)</span>
            </button>

            {sessionExportData?.string_session && (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sessionExportData.string_session);
                    setCopiedSessionStr(true);
                    setTimeout(() => setCopiedSessionStr(false), 2000);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {copiedSessionStr ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSessionStr ? 'Copied String Session!' : 'Copy Raw Session String'}</span>
                </button>

                <div className={`p-3 rounded-xl border text-[11px] font-mono break-all max-h-24 overflow-y-auto ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <p className="text-[10px] font-sans font-bold text-slate-400 mb-1">StringSession Preview:</p>
                  {sessionExportData.string_session}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAuthModal() {
    if (!showAuthModal) return null;

    // STEP 1: WEB ACCOUNT LOGIN & REGISTRATION (USERNAME & PASSWORD)
    if (!webUser) {
      return (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
          darkMode ? 'bg-slate-950/75' : 'bg-slate-900/45'
        }`}>
          <div className={`rounded-3xl max-w-md w-full p-7 shadow-2xl relative space-y-5 border transition-colors ${
            darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-white/90 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {webAuthMode === 'login' ? 'Sign In to Your Cloud Account' : 'Create Your Cloud Account'}
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Isolated personal space powered by your own Telegram account
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAuthModal(false);
                  if (currentRoute === '/login' || currentRoute === '/register') navigate('/');
                }}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Login vs Register Switcher */}
            <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border ${
              darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => { setWebAuthMode('login'); setWebAuthError(null); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  webAuthMode === 'login'
                    ? (darkMode ? 'bg-slate-800 text-white shadow-xs border border-sky-500/30' : 'bg-white text-slate-900 shadow-xs border border-sky-500/30')
                    : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setWebAuthMode('register'); setWebAuthError(null); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  webAuthMode === 'register'
                    ? (darkMode ? 'bg-slate-800 text-white shadow-xs border border-sky-500/30' : 'bg-white text-slate-900 shadow-xs border border-sky-500/30')
                    : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleWebAuthSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={webUsernameInput}
                  onChange={(e) => setWebUsernameInput(e.target.value)}
                  placeholder="Enter your username (e.g. alex_cloud)"
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={webPasswordInput}
                  onChange={(e) => setWebPasswordInput(e.target.value)}
                  placeholder={webAuthMode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium ${inputBg}`}
                />
              </div>

              {webAuthMode === 'register' && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={webConfirmPasswordInput}
                    onChange={(e) => setWebConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium ${inputBg}`}
                  />
                </div>
              )}

              {webAuthError && (
                <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  darkMode ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{webAuthError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={webAuthLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {webAuthLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {webAuthLoading
                    ? 'Authenticating...'
                    : webAuthMode === 'login'
                    ? 'Sign In to Dashboard'
                    : 'Create Account & Continue'}
                </span>
              </button>
            </form>

            <div className={`p-3.5 rounded-2xl border text-[11px] space-y-1 ${subCardBg}`}>
              <p className="font-bold flex items-center gap-1.5 text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% Isolated Personal Cloud</span>
              </p>
              <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                After signing in, you will connect your own Telegram account via Phone Number & OTP and choose between Saved Messages or a Custom Channel for storage.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // STEP 2: CONNECT PERSONAL TELEGRAM ACCOUNT (LIVE PHONE NUMBER & OTP + STORAGE TARGET TOGGLE)
    return (
      <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
        darkMode ? 'bg-slate-950/70' : 'bg-slate-900/40'
      }`}>
        <div className={`rounded-3xl max-w-lg w-full p-7 shadow-2xl relative space-y-4 border transition-colors max-h-[92vh] overflow-y-auto ${
          darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-white/90 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Connect Your Telegram Account
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    @{webUser.username}
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Link your personal Telegram account for unlimited cloud storage
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className={`p-2 rounded-xl transition ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              ✕
            </button>
          </div>

          {/* Storage Destination Toggle: Saved Messages vs Custom Channel */}
          <div className={`p-3.5 rounded-2xl border space-y-2.5 ${subCardBg}`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-extrabold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Default File Storage Destination
              </label>
              <span className="text-[10px] font-mono text-sky-400 font-bold">
                {storageTargetMode === 'me' ? 'Saved Messages (me)' : 'Custom Channel'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStorageTargetMode('me');
                  setTargetChatInput('me');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  storageTargetMode === 'me'
                    ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                    : (darkMode ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Saved Messages</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStorageTargetMode('custom');
                  if (targetChatInput === 'me') setTargetChatInput('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  storageTargetMode === 'custom'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : (darkMode ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Custom Channel</span>
              </button>
            </div>
            {storageTargetMode === 'custom' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={targetChatInput === 'me' ? '' : targetChatInput}
                  onChange={(e) => setTargetChatInput(e.target.value.trim() || 'me')}
                  placeholder="Enter Channel ID (e.g. -1001234567890) or @channel_username"
                  className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono ${inputBg}`}
                />
              </div>
            )}
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl border ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => { setAuthMode('phone'); stopQrPolling(); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                authMode === 'phone'
                  ? (darkMode ? 'bg-slate-800 text-white shadow-xs border border-indigo-500/30' : 'bg-white text-slate-900 shadow-xs border border-indigo-500/30')
                  : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phone OTP</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('qr'); handleStartQrLogin(); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                authMode === 'qr'
                  ? (darkMode ? 'bg-slate-800 text-white shadow-xs border border-sky-500/30' : 'bg-white text-slate-900 shadow-xs border border-sky-500/30')
                  : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span>QR Scan</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('bot'); stopQrPolling(); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                authMode === 'bot'
                  ? (darkMode ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                  : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>Bot Token</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('session'); stopQrPolling(); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                authMode === 'session'
                  ? (darkMode ? 'bg-slate-800 text-white shadow-xs border border-amber-500/30' : 'bg-white text-slate-900 shadow-xs border border-amber-500/30')
                  : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <FileKey className="w-3.5 h-3.5 text-amber-400" />
              <span>Session File</span>
              <span className="text-[9px] px-1 rounded-sm bg-amber-500 text-slate-950 uppercase font-bold">Key</span>
            </button>
          </div>

          {authMode === 'qr' && (
            <div className="space-y-4 text-center">
              <div className={`p-5 rounded-3xl border flex flex-col items-center justify-center space-y-4 ${subCardBg}`}>
                <div className="relative p-3 rounded-2xl bg-white shadow-xl">
                  {loginQrLoading ? (
                    <div className="w-[200px] h-[200px] flex flex-col items-center justify-center space-y-2 text-slate-600">
                      <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
                      <p className="text-xs font-bold">Generating QR Code...</p>
                    </div>
                  ) : loginQrDataUrl ? (
                    <img src={loginQrDataUrl} alt="Telegram QR Login" className="w-[200px] h-[200px] rounded-lg" />
                  ) : (
                    <div className="w-[200px] h-[200px] flex flex-col items-center justify-center space-y-2 text-slate-600">
                      <QrCode className="w-10 h-10 text-slate-400" />
                      <button
                        onClick={() => handleStartQrLogin(false)}
                        className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-sky-400"
                      >
                        Generate QR Code
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-left w-full max-w-xs text-xs">
                  <p className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>How to scan & connect:</p>
                  <ol className={`space-y-1 list-decimal list-inside text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <li>Open <strong>Telegram</strong> on your phone</li>
                    <li>Go to <strong>Settings → Devices</strong></li>
                    <li>Tap <strong>"Link Desktop Device"</strong> and scan this QR code</li>
                  </ol>
                </div>

                {needs2FA && (
                  <form onSubmit={handleVerifyQr2FA} className="w-full max-w-xs space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-left animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      <span>Two-Factor Authentication (2FA)</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      QR scan recognized! Your Telegram account requires your 2FA cloud password to complete sign-in:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        required
                        value={twoFaPassword}
                        onChange={(e) => setTwoFaPassword(e.target.value)}
                        placeholder="Your 2FA cloud password"
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${inputBg}`}
                      />
                      <button
                        type="submit"
                        disabled={authSubmitting || !twoFaPassword.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-emerald-400 hover:to-teal-500 transition active:scale-95"
                      >
                        {authSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
                      </button>
                    </div>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => handleStartQrLogin(false)}
                  disabled={loginQrLoading}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loginQrLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh QR Code</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            {authMode === 'phone' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Country & Mobile Number
                  </label>
                  <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Auto-code: <strong className={`font-mono ${darkMode ? 'text-sky-300' : 'text-slate-800'}`}>{selectedCountry.flag} {selectedCountry.dialCode}</strong>
                  </span>
                </div>

                {/* Country Picker & Phone Input Group */}
                <div className="relative">
                  <div className={`flex rounded-2xl border transition overflow-visible ${
                    darkMode
                      ? 'border-slate-800 bg-slate-950 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-500'
                      : 'border-slate-200 bg-white shadow-xs focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500'
                  }`}>
                    {/* Country Selector Dropdown Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                        className={`h-full flex items-center space-x-1.5 px-3 py-2.5 border-r rounded-l-2xl text-xs font-bold transition active:scale-95 ${
                          darkMode
                            ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800'
                        }`}
                        title="Click to select country"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span className={`font-mono font-bold ${darkMode ? 'text-sky-400' : 'text-slate-700'}`}>{selectedCountry.dialCode}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform" />
                      </button>

                      {/* Dropdown Menu */}
                      {countryDropdownOpen && (
                        <div className={`absolute left-0 top-full mt-2 w-72 backdrop-blur-2xl border rounded-2xl shadow-2xl z-50 p-2 space-y-2 max-h-72 flex flex-col ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white/98 border-slate-200 text-slate-800'
                        }`}>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              autoFocus
                              value={countrySearchTerm}
                              onChange={(e) => setCountrySearchTerm(e.target.value)}
                              placeholder="Search country or code..."
                              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                                darkMode ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-800'
                              }`}
                            />
                          </div>

                          <div className={`overflow-y-auto max-h-56 space-y-0.5 pr-1 divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {COUNTRIES.filter(c =>
                              c.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
                              c.dialCode.includes(countrySearchTerm) ||
                              c.code.toLowerCase().includes(countrySearchTerm.toLowerCase())
                            ).map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => handleCountrySelect(c)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                                  selectedCountry.code === c.code 
                                    ? (darkMode ? 'bg-sky-950/60 text-sky-400 font-bold' : 'bg-sky-50 text-sky-700 font-bold')
                                    : (darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <span className="text-base">{c.flag}</span>
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className={`font-mono text-[11px] ml-2 flex-shrink-0 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {c.dialCode}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* National Phone Input */}
                    <input
                      type="tel"
                      required
                      value={nationalPhone}
                      onChange={(e) => handleNationalPhoneChange(e.target.value)}
                      placeholder={`e.g. ${selectedCountry.example}`}
                      className={`flex-1 bg-transparent px-3.5 py-2.5 text-xs font-mono tracking-wider focus:outline-none placeholder-slate-400 ${
                        darkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    />

                    {/* Clear Button */}
                    {nationalPhone && (
                      <button
                        type="button"
                        onClick={() => { setNationalPhone(''); setPhone(''); }}
                        className="px-3 text-slate-400 hover:text-slate-200 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Country Validation & Digits Counter */}
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <div>
                    {(() => {
                      const digits = nationalPhone.replace(/[^\d]/g, '');
                      const val = validatePhoneNumber(selectedCountry, digits);
                      if (!digits) {
                        return (
                          <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>
                            Enter mobile number (e.g. {selectedCountry.example})
                          </span>
                        );
                      }
                      if (val.valid) {
                        return (
                          <span className={`inline-flex items-center space-x-1 font-semibold px-2 py-0.5 rounded-full border ${
                            darkMode ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{val.message}</span>
                          </span>
                        );
                      }
                      return (
                        <span className={darkMode ? 'text-amber-400 font-medium' : 'text-amber-600 font-medium'}>
                          {val.message}
                        </span>
                      );
                    })()}
                  </div>

                  {selectedCountry.code === 'IN' && (
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      nationalPhone.replace(/[^\d]/g, '').length === 10
                        ? (darkMode ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                        : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                    }`}>
                      {nationalPhone.replace(/[^\d]/g, '').length}/10 digits
                    </span>
                  )}
                </div>

                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  Telegram will send an official verification code directly to your Telegram app.
                </p>
              </div>
            )}

            {authMode === 'bot' && (
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    required
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>From @BotFather on Telegram.</p>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Storage Destination Channel / Chat ID
                  </label>
                  <input
                    type="text"
                    value={targetChatInput === 'me' ? '' : targetChatInput}
                    onChange={(e) => setTargetChatInput(e.target.value.trim() || 'me')}
                    placeholder="e.g. -1001234567890 or @my_storage_channel"
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Telegram bots store files in a Channel or Group where the bot is added as an Administrator.
                  </p>
                </div>
              </div>
            )}

            {authMode === 'session' && (
              <div className="space-y-3">
                {/* File Drop / Upload Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Upload Session File (.telecloud, .session, .txt)
                    </label>
                    <span className="text-[10px] text-amber-500 font-semibold">No OTP / No QR Needed</span>
                  </div>
                  
                  <input
                    type="file"
                    ref={sessionFileInputRef}
                    accept=".telecloud,.session,.txt,application/json,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSessionFileProcess(file);
                    }}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingSessionFile(true);
                    }}
                    onDragLeave={() => setIsDraggingSessionFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingSessionFile(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleSessionFileProcess(file);
                    }}
                    onClick={() => sessionFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition select-none ${
                      isDraggingSessionFile
                        ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
                        : uploadedSessionFileName
                        ? (darkMode ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-emerald-500/50 bg-emerald-50/60')
                        : (darkMode ? 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-950' : 'border-slate-200 hover:border-amber-500/50 hover:bg-amber-50/30')
                    }`}
                  >
                    {uploadedSessionFileName ? (
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-xs mx-auto">
                          {uploadedSessionFileName}
                        </p>
                        {uploadedSessionUser && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            Account: {uploadedSessionUser.first_name || ''} {uploadedSessionUser.username ? `(@${uploadedSessionUser.username})` : `ID: ${uploadedSessionUser.id || ''}`}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500">
                          Click to select a different session file
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <FileKey className="w-5 h-5" />
                        </div>
                        <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          Drop your .telecloud or .session file here
                        </p>
                        <p className="text-[11px] text-slate-400">
                          or click to browse your computer
                        </p>
                      </div>
                    )}
                  </div>

                  {sessionFileError && (
                    <p className="text-rose-500 text-[11px] font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{sessionFileError}</span>
                    </p>
                  )}
                </div>

                {/* Option to toggle raw text pasting */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawSessionText(!showRawSessionText)}
                    className="text-[11px] font-semibold text-sky-500 hover:text-sky-400 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showRawSessionText ? 'Hide manual string paste' : 'Or paste raw session string manually'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showRawSessionText ? 'rotate-180' : ''}`} />
                  </button>

                  {showRawSessionText && (
                    <div className="mt-2 animate-in fade-in duration-150">
                      <textarea
                        rows={3}
                        value={stringSession}
                        onChange={(e) => {
                          setStringSession(e.target.value);
                          setUploadedSessionFileName(null);
                        }}
                        placeholder="Paste your Telethon 1BJWap1w... session string here"
                        className={`w-full border rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} leading-normal`}>
                  Instant cryptographically authorized MTProto handshake directly to Telegram datacenters.
                </p>
              </div>
            )}

            {authError && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                darkMode ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
                {authMode !== 'qr' && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('qr'); handleStartQrLogin(); }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>⚡ Switch to QR Code Scan (Recommended & Instant)</span>
                  </button>
                )}
              </div>
            )}

            {authMode !== 'qr' && !phoneCodeHash && (
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2"
              >
                {authSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>
                  {authSubmitting
                    ? 'Contacting Telegram MTProto...'
                    : authMode === 'phone'
                    ? 'Send Verification Code to Telegram'
                    : authMode === 'session'
                    ? 'Sign In with Session Key'
                    : 'Connect with Telegram'}
                </span>
              </button>
            )}
          </form>

          {phoneCodeHash && (
            <form onSubmit={handleVerifyPhoneCode} className={`mt-4 pt-4 border-t space-y-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className={`p-3.5 rounded-2xl border text-xs font-medium ${
                darkMode ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}>
                Verification code sent to <strong>{phone}</strong>! Check your Telegram app.
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Telegram Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="e.g. 54321"
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {needs2FA && (
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Two-Factor Authentication (2FA) Password
                  </label>
                  <input
                    type="password"
                    required
                    value={twoFaPassword}
                    onChange={(e) => setTwoFaPassword(e.target.value)}
                    placeholder="Your 2FA cloud password"
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
              >
                {authSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>Confirm Code & Enter Cloud</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }
}
