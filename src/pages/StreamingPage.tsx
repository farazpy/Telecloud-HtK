import React, { useState } from 'react';
import {
  Film,
  Play,
  Radio,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Tv,
  Smartphone,
  Laptop,
  Gauge,
  Sliders,
  Volume2,
  Maximize2,
  Share2,
  Lock,
  Clock,
  Layers,
  Activity,
  Compass,
} from 'lucide-react';

interface PageProps {
  darkMode: boolean;
  onConnectClick: () => void;
  navigate: (path: string) => void;
}

export default function StreamingPage({ darkMode, onConnectClick, navigate }: PageProps) {
  const [seekPos, setSeekPos] = useState<number>(42);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const cardBg = darkMode
    ? 'bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 text-slate-100 shadow-xl'
    : 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 text-slate-900 shadow-xs';

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>MTProto Range Stream CDN</span>
        </div>

        <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          High-Speed Seekable <span className="bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">Media Streaming</span> on Demand.
        </h1>

        <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'} max-w-3xl mx-auto`}>
          TeleCloud dynamically converts Telegram MTProto documents into instant, seekable HTTP 206 Partial Content streams. Play 4K videos, FLAC lossless audio, and podcast tracks directly in any browser with zero pre-download delay.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onConnectClick}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-rose-500/20 transition flex items-center space-x-2 group"
          >
            <span>Launch Streamer</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/features')}
            className={`px-7 py-3.5 rounded-xl border font-bold text-sm transition ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            View Feature Specs
          </button>
        </div>
      </div>

      {/* Interactive Range Player Simulator */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`p-8 sm:p-12 rounded-3xl ${cardBg} space-y-8 relative overflow-hidden shadow-2xl`}>
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Live Player Simulation</span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Experience Sub-15ms Range Seeking
            </h2>
            <p className={`text-xs sm:text-sm max-w-lg mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Drag the timeline scrubber below to simulate how TeleCloud fetches only the exact byte range requested by the video player.
            </p>
          </div>

          {/* Simulated Player Viewport */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 text-white shadow-2xl">
            {/* Screen Mockup */}
            <div className="h-64 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-slate-800/80 flex flex-col justify-between p-4 relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs font-mono font-bold text-slate-300">TeleCloud HTTP 206 Stream Player</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
                  4K 2160p (H.265 / HEVC)
                </span>
              </div>

              {/* Center Play Button Overlay */}
              <div className="flex items-center justify-center z-10">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-rose-500/90 hover:bg-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-500/40 transition hover:scale-105"
                >
                  <Play className={`w-7 h-7 ml-1 ${isPlaying ? 'fill-white' : ''}`} />
                </button>
              </div>

              {/* Bottom Scrubber & Metadata */}
              <div className="space-y-2 z-10">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>{(seekPos * 1.45).toFixed(0)}m 12s / 120m 00s</span>
                  <span className="text-emerald-400 font-bold">Chunk Relay: 7.8 ms</span>
                </div>
                {/* Timeline bar */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={seekPos}
                  onChange={(e) => setSeekPos(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>

            {/* Live Range Request Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Active Byte Range</span>
                <p className="font-bold text-sky-400">
                  {Math.round(seekPos * 42.9)}MB - {Math.round(seekPos * 42.9 + 2)}MB
                </p>
                <p className="text-[10px] text-slate-400">of 4.29 GB total payload</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">VPS Memory Buffer</span>
                <p className="font-bold text-emerald-400">2,048 KB Chunk</p>
                <p className="text-[10px] text-slate-400">0 KB written to VPS disk</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Client Protocol</span>
                <p className="font-bold text-purple-400">HTTP/1.1 206 Partial</p>
                <p className="text-[10px] text-slate-400">Direct TCP stream socket</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Compatibility Matrix */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 pb-8">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Universal Support</span>
          <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-950'}`}>
            Cross-Platform Player Compatibility
          </h2>
          <p className={`text-xs sm:text-sm max-w-xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            TeleCloud generates standard HTTP stream URLs that work instantly in any media software without plugins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Tv className="w-6 h-6 text-white" />,
              gradient: 'from-sky-400 to-indigo-500',
              shadow: 'shadow-sky-500/20',
              title: 'Smart TVs & Cast',
              platforms: 'Apple TV, Chromecast, Android TV, Roku',
              desc: 'Stream full movies over DLNA / HTTP URLs with complete pause and scrub control.',
            },
            {
              icon: <Smartphone className="w-6 h-6 text-white" />,
              gradient: 'from-rose-400 to-pink-500',
              shadow: 'shadow-rose-500/20',
              title: 'Mobile Apps',
              platforms: 'iOS AVPlayer, Android ExoPlayer, Flutter',
              desc: 'Native streaming directly into your mobile apps with byte-range token headers.',
            },
            {
              icon: <Laptop className="w-6 h-6 text-white" />,
              gradient: 'from-purple-500 to-indigo-600',
              shadow: 'shadow-purple-500/20',
              title: 'Desktop Players',
              platforms: 'VLC Player, IINA, MPV, QuickTime',
              desc: 'Open Network Stream and play instantly with zero local disk buffering.',
            },
            {
              icon: <Radio className="w-6 h-6 text-white" />,
              gradient: 'from-emerald-400 to-teal-500',
              shadow: 'shadow-emerald-500/20',
              title: 'Audio Players',
              platforms: 'HTML5 Audio, Spotify-like Web UIs, FLAC',
              desc: 'Instant audio scrub without downloading multi-gigabyte album collections.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl ${cardBg} space-y-4 text-left group hover:border-rose-500/40 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{item.title}</h3>
              <p className="text-[11px] font-mono text-rose-400 font-bold">{item.platforms}</p>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
