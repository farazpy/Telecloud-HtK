import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Save,
  Globe,
  Smartphone,
  Laptop,
  Users,
  HardDrive,
  Sliders,
  Radio,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface DevicePreset {
  id: string;
  name: string;
  deviceModel: string;
  systemVersion: string;
  appVersion: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'telecloud',
    name: 'TeleCloud Cloud V...',
    deviceModel: 'TeleCloud Vault',
    systemVersion: 'macOS Sonoma 14.5',
    appVersion: 'TeleCloud Vault v1.5.2',
  },
  {
    id: 'macbook',
    name: 'Apple MacBook Pro',
    deviceModel: 'MacBook Pro M3 Max',
    systemVersion: 'macOS Sequoia 15.1',
    appVersion: 'Telegram macOS 11.2',
  },
  {
    id: 'iphone',
    name: 'Apple iPhone 16 Pro',
    deviceModel: 'iPhone 16 Pro Max',
    systemVersion: 'iOS 18.2',
    appVersion: 'Telegram iOS 11.4',
  },
  {
    id: 'windows',
    name: 'Windows 11 Worksta...',
    deviceModel: 'Windows 11 Workstation',
    systemVersion: 'Windows 11 Pro 23H2',
    appVersion: 'Telegram Desktop 5.6.1',
  },
  {
    id: 'galaxy',
    name: 'Samsung Galaxy S24',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    systemVersion: 'Android 15 (One UI 7)',
    appVersion: 'Telegram Android 11.3',
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

  // Active Tab
  const [activeTab, setActiveTab] = useState<'device' | 'telegram' | 'engine' | 'users' | 'security'>('device');

  // Settings State (Loaded from MySQL)
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
  });

  const [dbStatus, setDbStatus] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
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
        setSettings(data.settings);
        setDbStatus(data.dbStatus);
        setOverview(data.overview);
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
        setSaveError(data.error || 'Failed to load system settings');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Network error fetching settings');
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
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(data.error || 'Failed to save settings to MySQL database.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Network error saving settings.');
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

  // --------------------------------------------------------------------------
  // LOCKED SCREEN: PIN ENTRY (Keypad + Input for PIN 9890)
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8 relative">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TeleCloud System Admin</h1>
            <p className="text-xs text-slate-400 mt-1">Enter Master Admin PIN to configure system & MySQL</p>
          </div>

          <form onSubmit={(e) => handleVerifyPin(e)} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
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
                  autoFocus
                  className="w-full bg-slate-950/80 border border-slate-700/70 focus:border-cyan-500 rounded-2xl py-3.5 px-4 text-center text-2xl font-mono tracking-widest text-white placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            <div className="grid grid-cols-3 gap-2 pt-1">
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
                  className="py-3 bg-slate-800/60 hover:bg-slate-700/60 active:bg-cyan-500/20 border border-slate-700/50 rounded-xl text-lg font-semibold text-slate-200 hover:text-white transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3 bg-slate-800/40 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700/40 rounded-xl transition-all"
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
                className="py-3 bg-slate-800/60 hover:bg-slate-700/60 active:bg-cyan-500/20 border border-slate-700/50 rounded-xl text-lg font-semibold text-slate-200 hover:text-white transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput((p) => p.slice(0, -1))}
                className="py-3 bg-slate-800/40 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700/40 rounded-xl transition-all"
              >
                Del
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifyingPin || !pinInput}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-medium rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              {isVerifyingPin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Admin Panel</span>
                </>
              )}
            </button>

            {onNavigateHome && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Return to Main Cloud Vault
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // UNLOCKED SCREEN: COMPLETE SYSTEM ADMIN CONSOLE
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">TeleCloud System Control Panel</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MySQL Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live hardware presets, MTProto device identity, and centralized database configuration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-white transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Save Success / Error Alerts */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>All system settings successfully updated in MySQL database and applied to live workers!</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('device')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'device'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Device & Identity (Image UI)</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'telegram'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Telegram Core & Proxy</span>
        </button>

        <button
          onClick={() => setActiveTab('engine')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'engine'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Performance & Chunk Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>MySQL Users & Sessions ({overview?.users?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Admin PIN & Security</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DEVICE IDENTITY & PRESETS (Exact match to User's Uploaded UI) */}
      {/* ==================================================================== */}
      {activeTab === 'device' && (
        <div className="space-y-6">
          {/* Main Card (Matches user image exactly) */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative">
            {/* Header: Active Session Device */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    ACTIVE SESSION DEVICE:
                  </div>
                  <div className="text-base font-bold text-cyan-400">
                    {settings.device_model || 'TeleCloud Vault'} •{' '}
                    <span className="text-slate-300 font-normal">{settings.system_version || 'macOS Sonoma 14.5'}</span>
                  </div>
                </div>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              )}
            </div>

            {/* Choose Device Preset */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                CHOOSE DEVICE PRESET (DISPLAYS ON PHONE SETTINGS → DEVICES):
              </div>
              <div className="flex flex-wrap gap-2.5">
                {DEVICE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-850 border border-slate-800'
                      }`}
                    >
                      <span>{preset.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Custom Device Name:</label>
                <input
                  type="text"
                  value={settings.device_model}
                  onChange={(e) => {
                    setSelectedPresetId('custom');
                    setSettings({ ...settings, device_model: e.target.value });
                  }}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="e.g. TeleCloud Vault"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Custom OS / System:</label>
                <input
                  type="text"
                  value={settings.system_version}
                  onChange={(e) => {
                    setSelectedPresetId('custom');
                    setSettings({ ...settings, system_version: e.target.value });
                  }}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="e.g. macOS Sonoma 14.5"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-400">Custom App Version String:</label>
                <input
                  type="text"
                  value={settings.app_version}
                  onChange={(e) => {
                    setSelectedPresetId('custom');
                    setSettings({ ...settings, app_version: e.target.value });
                  }}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="e.g. TeleCloud Vault v1.5.2"
                />
              </div>
            </div>

            {/* Live Location / Egress IP */}
            {location && (
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>
                    Egress IP: <strong className="text-slate-200">{location.ip || 'Direct'}</strong>
                  </span>
                  {location.city && (
                    <span className="text-slate-500">
                      • {location.city}, {location.country}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  MTProto Connected
                </span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm rounded-2xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Update in MySQL</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: TELEGRAM CORE & PROXY CONFIGURATION */}
      {/* ==================================================================== */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <Radio className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">Telegram MTProto Infrastructure</h3>
                <p className="text-xs text-slate-400">
                  Configure default Telegram Application Credentials and SOCKS5/MTProto Proxy
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Default Telegram API ID:</label>
                <input
                  type="text"
                  value={settings.telegram_api_id}
                  onChange={(e) => setSettings({ ...settings, telegram_api_id: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="27254692"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Default Telegram API HASH:</label>
                <input
                  type="text"
                  value={settings.telegram_api_hash}
                  onChange={(e) => setSettings({ ...settings, telegram_api_hash: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="9f6f826a62b78378292fd224e943cb65"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Default Storage Chat Channel:</label>
                <input
                  type="text"
                  value={settings.storage_chat}
                  onChange={(e) => setSettings({ ...settings, storage_chat: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="me or -100xxxxxxxxxx"
                />
                <p className="text-[11px] text-slate-500">
                  Use <code>me</code> for Saved Messages or channel ID for shared storage.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">MTProto Proxy URL (Optional):</label>
                <input
                  type="text"
                  value={settings.proxy_url}
                  onChange={(e) => setSettings({ ...settings, proxy_url: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="socks5://user:pass@host:port or tg://proxy?..."
                />
                <p className="text-[11px] text-slate-500">
                  Leave empty for high-speed direct datacenter connection.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm rounded-2xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Update in MySQL</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PERFORMANCE & CHUNK ENGINE CONFIGURATION */}
      {/* ==================================================================== */}
      {activeTab === 'engine' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Upload Engine & Concurrency Tuner</h3>
                <p className="text-xs text-slate-400">
                  Fine-tune multi-part chunk buffers and parallel throughput for Telegram 2GB/4GB files.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Upload Chunk Buffer Size (KB):</label>
                <select
                  value={settings.upload_chunk_size_kb}
                  onChange={(e) => setSettings({ ...settings, upload_chunk_size_kb: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="128">128 KB (Low RAM servers)</option>
                  <option value="256">256 KB (Balanced)</option>
                  <option value="512">512 KB (Standard Recommended)</option>
                  <option value="1024">1024 KB / 1 MB (High Speed)</option>
                  <option value="2048">2048 KB / 2 MB (Gigabit Connections)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Max Parallel Worker Concurrency:</label>
                <select
                  value={settings.max_parallel_uploads}
                  onChange={(e) => setSettings({ ...settings, max_parallel_uploads: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="2">2 Parallel Uploads</option>
                  <option value="4">4 Parallel Uploads (Recommended)</option>
                  <option value="6">6 Parallel Uploads</option>
                  <option value="8">8 Parallel Uploads (High CPU)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm rounded-2xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Update in MySQL</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: USERS & 30-DAY SESSION MANAGER */}
      {/* ==================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Database Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {overview?.total_users || 0}
              </div>
            </div>

            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Stored Files</span>
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {overview?.total_files || 0}
              </div>
            </div>

            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Storage Consumed</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {overview?.total_size_bytes
                  ? `${(overview.total_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : '0.00 GB'}
              </div>
            </div>
          </div>

          {/* User Sessions Table */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">MySQL User Accounts & 30-Day Sessions</h3>
                <p className="text-xs text-slate-400">
                  Inspect active session expiration, file count, and trigger 30-day renewals.
                </p>
              </div>
              <button
                onClick={fetchSettings}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 px-3">Telegram ID</th>
                    <th className="pb-3 px-3">Name / Username</th>
                    <th className="pb-3 px-3">Session Status</th>
                    <th className="pb-3 px-3">Expires At</th>
                    <th className="pb-3 px-3">Files / Storage</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(overview?.users || []).map((u: any) => (
                    <tr key={u.telegram_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-cyan-400 font-medium">{u.telegram_id}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.username || u.phone || 'No username'}</div>
                      </td>
                      <td className="py-3 px-3">
                        {u.is_expired ? (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-medium">
                            Expired
                          </span>
                        ) : u.session_status === 'active' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">
                            Active (30-Day)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
                            Disconnected
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {u.expires_at ? new Date(u.expires_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {u.file_count} files ({(u.storage_used / (1024 * 1024)).toFixed(1)} MB)
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRenewUserSession(u.telegram_id)}
                          disabled={userActionLoading === String(u.telegram_id)}
                          className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-medium transition-all"
                        >
                          {userActionLoading === String(u.telegram_id) ? 'Verifying...' : 'Verify & Renew'}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {(!overview?.users || overview.users.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No registered Telegram accounts found in MySQL.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {userActionMsg && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs border ${
                  userActionMsg.success
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {userActionMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: SECURITY & ADMIN PIN */}
      {/* ==================================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-w-xl">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">Change Master Admin PIN</h3>
                <p className="text-xs text-slate-400">
                  Update the master passcode used to access this /admin dashboard (Default: 9890).
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Admin PIN (Min 4 digits):</label>
                <input
                  type="password"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="Enter new numeric PIN"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm New Admin PIN:</label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-sm font-mono text-white focus:outline-none transition-all"
                  placeholder="Re-enter new numeric PIN"
                />
              </div>

              {pinChangeMsg && (
                <div
                  className={`p-3 rounded-xl text-xs border ${
                    pinChangeMsg.error
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {pinChangeMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Shield className="w-4 h-4" />
                <span>Save New PIN to MySQL</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
