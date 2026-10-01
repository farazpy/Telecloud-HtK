import React from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  EyeOff,
  Fingerprint,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Server,
  FileKey2,
  Terminal,
  Clock,
  Database,
  Layers,
} from 'lucide-react';

interface PageProps {
  darkMode: boolean;
  onConnectClick: () => void;
  navigate: (path: string) => void;
}

export default function SecurityPage({ darkMode, onConnectClick, navigate }: PageProps) {
  const cardBg = darkMode
    ? 'bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 text-slate-100 shadow-xl'
    : 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 text-slate-900 shadow-xs';

  const securityFeatures = [
    {
      icon: <Lock className="w-6 h-6 text-white" />,
      gradient: 'from-purple-500 to-indigo-600',
      shadow: 'shadow-purple-500/20',
      title: 'MTProto 2.0 AES-256-IGE Cryptography',
      desc: 'All bytes transmitted between your VPS and Telegram data centers are encrypted using Telegram’s enterprise-grade Infinite Galois Extension (IGE) block cipher mode with 2048-bit RSA authentication.',
    },
    {
      icon: <EyeOff className="w-6 h-6 text-white" />,
      gradient: 'from-sky-400 to-cyan-500',
      shadow: 'shadow-sky-500/20',
      title: 'Zero Master Passwords Stored',
      desc: 'TeleCloud never stores Telegram account passwords or master credentials in plaintext. Authentication is handled via native Telegram OTP codes and ephemeral session files.',
    },
    {
      icon: <KeyRound className="w-6 h-6 text-white" />,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/20',
      title: 'Custom File Link Password Gating',
      desc: 'Attach individual passwords to any direct streaming or download link. Passwords are salted and hashed with SHA-256 before validation.',
    },
    {
      icon: <Clock className="w-6 h-6 text-white" />,
      gradient: 'from-rose-400 to-pink-500',
      shadow: 'shadow-rose-500/20',
      title: 'Configurable TTL Link Expiration',
      desc: 'Set automatic expiration limits (1 hour, 24 hours, 7 days, 30 days) on sensitive links. Once expired, links are instantly invalidated at the proxy layer.',
    },
    {
      icon: <Server className="w-6 h-6 text-white" />,
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      title: 'Self-Hosted MySQL Catalog Isolation',
      desc: 'Your file metadata, message IDs, and download logs remain on your own private MySQL database. No central server or third-party company can view your file index.',
    },
    {
      icon: <Fingerprint className="w-6 h-6 text-white" />,
      gradient: 'from-indigo-500 to-violet-600',
      shadow: 'shadow-indigo-500/20',
      title: 'API Bearer Token Authorization',
      desc: 'All programmatic API endpoints require unique cryptographically generated API keys that can be regenerated or revoked with a single click.',
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Cryptographic Security & Privacy</span>
        </div>

        <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          Zero-Knowledge <span className="bg-gradient-to-r from-purple-400 via-indigo-500 to-sky-500 bg-clip-text text-transparent">MTProto Cryptosystem</span> by Design.
        </h1>

        <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'} max-w-3xl mx-auto`}>
          Built from the ground up to protect your privacy. TeleCloud runs entirely on your own private server with zero third-party telemetry, end-to-end MTProto encryption, and granular link access controls.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onConnectClick}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-500/20 transition flex items-center space-x-2 group"
          >
            <span>Connect Private Vault</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/architecture')}
            className={`px-7 py-3.5 rounded-xl border font-bold text-sm transition ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            View Technical Architecture
          </button>
        </div>
      </div>

      {/* Security Architecture Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityFeatures.map((sec, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl ${cardBg} space-y-4 text-left group hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${sec.gradient} flex items-center justify-center shadow-lg ${sec.shadow} group-hover:scale-110 transition-transform duration-300`}>
                {sec.icon}
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{sec.title}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{sec.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security FAQ / Trust Guarantees */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`p-8 sm:p-12 rounded-3xl ${cardBg} space-y-8`}>
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Zero-Trust Guarantees</span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Security Questions & Protocol Answers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-200'} space-y-2`}>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Can anyone browse my storage channel?</h4>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                No. Your Telegram storage channel is completely private. Only your authenticated TeleCloud VPS instance holding the session auth key can request or stream documents.
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-200'} space-y-2`}>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Are direct links vulnerable to enumeration?</h4>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                No. TeleCloud generates non-sequential alphanumeric Base-36 tokens and supports optional SHA-256 password protection to prevent unauthorized scraping.
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-200'} space-y-2`}>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Where is the database located?</h4>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Your database is 100% self-hosted on your local VPS (MySQL / MariaDB). TeleCloud has zero cloud telemetry or centralized logging.
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-200'} space-y-2`}>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>How does link revocation work?</h4>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Deleting a file or changing its short ID in your dashboard immediately severs the link at the MySQL level, causing future HTTP stream requests to 404 instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
