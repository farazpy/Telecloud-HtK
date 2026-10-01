import React, { useState } from 'react';
import {
  Zap,
  HardDrive,
  Database,
  Radio,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Share2,
  Terminal,
  FileCode2,
  Search,
  KeyRound,
  Flame,
  FileVideo,
  Clock,
  Fingerprint,
} from 'lucide-react';

interface PageProps {
  darkMode: boolean;
  onConnectClick: () => void;
  navigate: (path: string) => void;
}

export default function FeaturesPage({ darkMode, onConnectClick, navigate }: PageProps) {
  const [activeTab, setActiveTab] = useState<'streaming' | 'database' | 'security' | 'workspaces'>('streaming');

  const cardBg = darkMode
    ? 'bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 text-slate-100 shadow-xl'
    : 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 text-slate-900 shadow-xs';

  const featurePillars = [
    {
      icon: <Radio className="w-6 h-6 text-white" />,
      gradient: 'from-sky-400 to-cyan-500',
      shadow: 'shadow-sky-500/20',
      title: 'HTTP 206 Byte-Range Streamer',
      tag: 'Zero Latency',
      description: 'Stream massive 4K video and lossless audio files directly from MTProto nodes with full HTML5 Range header seekability without downloading the entire payload first.',
      highlights: ['Instant timeline scrubbing', 'Native iOS/Android media player support', 'Automatic MIME detection & chunk alignment'],
    },
    {
      icon: <Database className="w-6 h-6 text-white" />,
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/20',
      title: 'Relational MySQL Indexing',
      tag: 'Sub-millisecond Search',
      description: 'Your self-hosted MySQL/MariaDB database maps every Telegram message ID, Base-36 short slug, SHA-256 integrity hash, password lock, and expiration timestamp.',
      highlights: ['Alphanumeric Base-36 short links', 'Zero full-table scan bottlenecks', 'Direct query search across millions of files'],
    },
    {
      icon: <Lock className="w-6 h-6 text-white" />,
      gradient: 'from-purple-500 to-fuchsia-600',
      shadow: 'shadow-purple-500/20',
      title: 'Time-Limited & Password Protected Vaults',
      tag: 'Zero-Knowledge',
      description: 'Lock any direct stream or download link behind SHA-256 hashed passcodes with auto-expiring access tokens and rate-limiting brute-force guards.',
      highlights: ['Custom access password gating', 'Configurable 1h to 30d TTL expiration', 'One-click emergency link revocation'],
    },
    {
      icon: <Layers className="w-6 h-6 text-white" />,
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      title: 'Multi-Workspace Isolation',
      tag: 'Multi-Tenant Ready',
      description: 'Create independent cloud sandboxes with distinct custom storage chat IDs, custom upload quotas, and tailored access permissions for separate projects or clients.',
      highlights: ['Dedicated chat mapping per workspace', 'Granular storage statistics & file counts', 'Seamless instant workspace switching'],
    },
    {
      icon: <Terminal className="w-6 h-6 text-white" />,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/20',
      title: 'Interactive REST API & Developer SDK',
      tag: 'Automation Ready',
      description: 'Integrate programmatic file uploads, direct link retrievals, stream proxying, and workspace queries via JSON REST endpoints secured by bearer API keys.',
      highlights: ['Postman-style interactive tester built-in', 'Pre-configured Python/curl code snippets', 'Instant API key regeneration'],
    },
    {
      icon: <Cpu className="w-6 h-6 text-white" />,
      gradient: 'from-rose-400 to-pink-600',
      shadow: 'shadow-rose-500/20',
      title: 'Multi-Part Async Python Daemon',
      tag: 'High Concurrency',
      description: 'Runs an optimized Telethon MTProto event daemon on your VPS to process multi-part chunk uploads up to 2GB/4GB per document with parallel chunk dispatching.',
      highlights: ['AES-256-IGE encrypted transport', 'Auto-reconnecting session loop', 'Low VPS RAM & CPU footprint'],
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>TeleCloud Core Capabilities</span>
        </div>
        
        <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          Engineered for <span className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">Unlimited MTProto</span> Storage.
        </h1>
        
        <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'} max-w-3xl mx-auto`}>
          TeleCloud replaces expensive cloud object stores (like AWS S3 or Wasabi) by converting Telegram’s infinite MTProto storage network into a lightning-fast, seekable HTTP streaming server managed on your own private VPS.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onConnectClick}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 transition flex items-center space-x-2 group"
          >
            <span>Launch Cloud Vault</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/architecture')}
            className={`px-7 py-3.5 rounded-xl border font-bold text-sm transition ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Explore Architecture
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featurePillars.map((feature, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl ${cardBg} flex flex-col justify-between space-y-6 text-left relative overflow-hidden group hover:border-sky-500/40 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feature.gradient} flex items-center justify-center shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
                    darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {feature.tag}
                  </span>
                </div>

                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                  {feature.title}
                </h3>

                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {feature.description}
                </p>
              </div>

              <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200/80'} space-y-2`}>
                {feature.highlights.map((h, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Deep-Dive Feature Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`p-8 sm:p-12 rounded-3xl ${cardBg} space-y-8`}>
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Deep Dive</span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Interactive Feature Anatomy
            </h2>
            <p className={`text-xs sm:text-sm max-w-xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Inspect how TeleCloud executes high-concurrency requests with zero local disk bloat.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b pb-4 border-slate-200 dark:border-slate-800">
            {[
              { id: 'streaming', label: 'HTTP 206 Streaming Engine' },
              { id: 'database', label: 'MySQL Schema & Indexing' },
              { id: 'security', label: 'AES-256-IGE & Passwords' },
              { id: 'workspaces', label: 'Isolated Workspaces' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === t.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'streaming' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-sky-500">
                  <FileVideo className="w-4 h-4" />
                  <span>True Random-Access Media Playback</span>
                </div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                  Seek Instantly to Any Timestamp in 4K Video
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Standard download links force the user to wait for a 4GB movie to finish downloading. TeleCloud parses incoming <code className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono text-xs">Range: bytes=X-Y</code> headers, requests only the specific 512KB MTProto block from Telegram, and streams it straight to the client socket without writing a single byte to your VPS hard disk.
                </p>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Compatible with VLC, QuickTime, Chrome, Safari, and smart TVs</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sub-10ms chunk relay latency on standard $5/mo VPS nodes</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero bandwidth egress surcharges</div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2.5 text-slate-300 overflow-x-auto shadow-2xl">
                <div className="text-slate-500 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>HTTP Range Pipeline Simulation</span>
                  <span className="text-emerald-400 text-[10px]">HTTP 206 PARTIAL CONTENT</span>
                </div>
                <p className="text-purple-400">&gt; GET /api/stream/a7x9q HTTP/1.1</p>
                <p className="text-sky-400">&gt; Range: bytes=104857600-105381887</p>
                <p className="text-slate-500">&gt; User-Agent: Mozilla/5.0 (HTML5 Video Player)</p>
                <div className="pt-2 text-emerald-400">&lt; HTTP/1.1 206 Partial Content</div>
                <div className="text-slate-400">&lt; Content-Range: bytes 104857600-105381887/4294967296</div>
                <div className="text-slate-400">&lt; Content-Type: video/mp4</div>
                <div className="text-slate-400">&lt; Accept-Ranges: bytes</div>
                <p className="text-indigo-400 pt-2">[TeleCloud Engine] Streamed 512 KB in 8.2ms directly from MTProto cluster</p>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-500">
                  <Database className="w-4 h-4" />
                  <span>Sub-Millisecond File Catalog</span>
                </div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                  Instant Metadata Lookups & Search
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Telegram channels are not indexed for instant search. TeleCloud maintains a local relational MySQL catalog storing message IDs, alphanumeric Base-36 tokens, MIME types, file sizes, creation timestamps, and workspace mappings.
                </p>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto-fallback JSON cache in case MySQL connection drops</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> B-Tree indexed Base-36 slugs for instant O(1) resolution</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Full workspace relational foreign key constraints</div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 text-slate-300 overflow-x-auto shadow-2xl">
                <div className="text-slate-500 pb-2 border-b border-slate-800">
                  <span>MySQL Schema (telecloud.files)</span>
                </div>
                <p className="text-indigo-300">CREATE TABLE `files` (</p>
                <p className="text-sky-300 pl-4">`id` INT AUTO_INCREMENT PRIMARY KEY,</p>
                <p className="text-sky-300 pl-4">`telegram_id` VARCHAR(64) NOT NULL,</p>
                <p className="text-sky-300 pl-4">`message_id` BIGINT NOT NULL,</p>
                <p className="text-sky-300 pl-4">`short_id` VARCHAR(16) UNIQUE,</p>
                <p className="text-sky-300 pl-4">`file_name` VARCHAR(255) NOT NULL,</p>
                <p className="text-sky-300 pl-4">`file_size` BIGINT NOT NULL,</p>
                <p className="text-sky-300 pl-4">`mime_type` VARCHAR(128),</p>
                <p className="text-sky-300 pl-4">`password_hash` VARCHAR(128) NULL,</p>
                <p className="text-sky-300 pl-4">`workspace_id` INT DEFAULT 1,</p>
                <p className="text-indigo-300">);</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-purple-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cryptographic Vault Protection</span>
                </div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                  Dual-Layer MTProto & Client Gatekeeping
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Every packet transmitted to Telegram is encrypted with AES-256-IGE. For public direct links, TeleCloud provides optional password protection and TTL expiration timers so that confidential documents can only be accessed with your authorization.
                </p>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> SHA-256 password hashing with salt verification</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated link expiration and memory purging</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Telegram 2FA session protection</div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Dynamic Link Security Matrix</h4>
                    <p className="text-[11px] text-slate-400">Configurable per individual file link</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Password Gate</span>
                    <p className="font-bold text-emerald-400">Enabled (SHA-256)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">TTL Timer</span>
                    <p className="font-bold text-sky-400">24 Hours Active</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Stream Proxy</span>
                    <p className="font-bold text-indigo-400">Direct VPS Socket</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Encryption</span>
                    <p className="font-bold text-purple-400">MTProto 2.0 IGE</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-500">
                  <Layers className="w-4 h-4" />
                  <span>Isolated Project Sandboxes</span>
                </div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                  Separate Chats for Distinct Environments
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Map specific Telegram channels or groups to separate workspaces (e.g. "Personal Media", "Client Deliverables", "Database Backups"). Files, quotas, API scopes, and analytics are isolated per workspace.
                </p>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Switch between workspaces with a single click</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Independent Telegram storage channel per workspace</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Move files between workspaces dynamically</div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300">Active Workspaces</span>
                  <span className="text-[10px] font-mono text-emerald-400">3 Isolated Channels</span>
                </div>
                {[
                  { name: '4K Cinema Vault', chat: 'Chat: -1001849204918', count: '148 Files', size: '640 GB' },
                  { name: 'Enterprise Backups', chat: 'Chat: -1002049182049', count: '829 Files', size: '1.2 TB' },
                  { name: 'Client Shared Assets', chat: 'Chat: -1001948201940', count: '94 Files', size: '82 GB' },
                ].map((w, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{w.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">{w.chat}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sky-400">{w.size}</p>
                      <p className="text-[10px] text-slate-500">{w.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Box */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-sky-900/60 via-indigo-950/80 to-slate-950 border border-sky-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Ready to Deploy Your Own TeleCloud Instance?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Connect your Telegram MTProto credentials and launch your own zero-cost cloud storage streamer today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onConnectClick}
              className="px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-xl shadow-sky-500/20 transition flex items-center space-x-2"
            >
              <span>Connect Vault Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm transition"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
