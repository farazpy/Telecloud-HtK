import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Globe,
  ShieldCheck,
  Server,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  BarChart3,
  Network,
  RefreshCw,
  Coins,
} from 'lucide-react';

interface PageProps {
  darkMode: boolean;
  onConnectClick: () => void;
  navigate: (path: string) => void;
}

export default function BenefitsPage({ darkMode, onConnectClick, navigate }: PageProps) {
  const [tbAmount, setTbAmount] = useState<number>(5);
  const [egressAmount, setEgressAmount] = useState<number>(10);

  const cardBg = darkMode
    ? 'bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 text-slate-100 shadow-xl'
    : 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 text-slate-900 shadow-xs';

  // S3 vs TeleCloud cost calculations
  // AWS S3 standard: $0.023 / GB storage + $0.09 / GB internet egress
  const s3StorageCost = tbAmount * 1024 * 0.023;
  const s3EgressCost = egressAmount * 1024 * 0.09;
  const s3TotalCost = s3StorageCost + s3EgressCost;

  // TeleCloud: $0 storage + $0 egress (fixed $5 VPS cost)
  const telecloudCost = 5.0;
  const monthlySavings = Math.max(0, s3TotalCost - telecloudCost);
  const annualSavings = monthlySavings * 12;

  const coreBenefits = [
    {
      icon: <DollarSign className="w-6 h-6 text-white" />,
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      title: '100% Free Infinite Storage',
      subtitle: '$0.00 / GB forever',
      description: 'Leverage Telegram’s infinite chat storage infrastructure without recurring cloud bills or surprise monthly egress invoices.',
    },
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      gradient: 'from-sky-400 to-cyan-500',
      shadow: 'shadow-sky-500/20',
      title: 'Ultra-Fast Edge Streaming',
      subtitle: '< 15ms Range Seeking',
      description: 'Direct byte-range chunk proxying skips whole-file downloads. Instant streaming playback for 4K video, high-bitrate FLAC, and large archives.',
    },
    {
      icon: <Server className="w-6 h-6 text-white" />,
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/20',
      title: 'Zero VPS Disk Consumption',
      subtitle: 'Runs on a $5/month VPS',
      description: 'Data blocks are streamed on-the-fly through memory buffers directly between the client and MTProto nodes, requiring zero local hard disk storage.',
    },
    {
      icon: <Globe className="w-6 h-6 text-white" />,
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20',
      title: 'Decentralized Data Center Backbone',
      subtitle: 'Global MTProto CDN',
      description: 'Take advantage of Telegram’s high-availability multi-region data center clusters across Europe, North America, and Asia automatically.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/20',
      title: 'Full Data Self-Sovereignty',
      subtitle: 'Private Relational Catalog',
      description: 'Your file metadata, message pointers, and workspace credentials remain strictly on your local MySQL database. No third-party lock-in.',
    },
    {
      icon: <Network className="w-6 h-6 text-white" />,
      gradient: 'from-rose-400 to-red-500',
      shadow: 'shadow-rose-500/20',
      title: 'Unlimited Public Direct Links',
      subtitle: 'Clean HTTP Base-36 URLs',
      description: 'Generate clean, shareable streaming URLs for websites, mobile apps, media players, and clients without exposing your Telegram handle.',
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Architectural Advantages & ROI</span>
        </div>

        <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          Why Developers Choose <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 bg-clip-text text-transparent">TeleCloud</span> Over Traditional S3.
        </h1>

        <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'} max-w-3xl mx-auto`}>
          Eliminate AWS S3 storage bills, bandwidth egress penalties, and API request surcharges forever. Experience true zero-cost cloud storage backed by Telegram’s enterprise MTProto infrastructure.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onConnectClick}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition flex items-center space-x-2 group"
          >
            <span>Start Saving Today</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/streaming-cdn')}
            className={`px-7 py-3.5 rounded-xl border font-bold text-sm transition ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            See Streaming Benchmarks
          </button>
        </div>
      </div>

      {/* Interactive Savings Calculator */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`p-8 sm:p-12 rounded-3xl ${cardBg} space-y-8 relative overflow-hidden`}>
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Interactive ROI Calculator</span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Calculate Your AWS S3 vs TeleCloud Savings
            </h2>
            <p className={`text-xs sm:text-sm max-w-lg mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Adjust your monthly storage capacity and bandwidth requirements to see how much you save.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
            {/* Left Column: Sliders */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Slider 1: Storage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>Cloud Storage Stored</span>
                  <span className="font-mono text-emerald-500 text-sm font-black">{tbAmount} TB ({tbAmount * 1024} GB)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={tbAmount}
                  onChange={(e) => setTbAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 TB</span>
                  <span>25 TB</span>
                  <span>50 TB</span>
                </div>
              </div>

              {/* Slider 2: Egress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>Monthly Streaming Egress</span>
                  <span className="font-mono text-sky-500 text-sm font-black">{egressAmount} TB ({egressAmount * 1024} GB)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={egressAmount}
                  onChange={(e) => setEgressAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 TB</span>
                  <span>50 TB</span>
                  <span>100 TB</span>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-950/80 border border-slate-800' : 'bg-slate-50 border border-slate-200'} space-y-2 text-xs font-mono`}>
                <div className="flex justify-between text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <span>Cost Item</span>
                  <span>AWS S3</span>
                  <span className="text-emerald-400 font-bold">TeleCloud</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Storage ({tbAmount} TB)</span>
                  <span className="text-rose-400 font-bold">${s3StorageCost.toFixed(2)}/mo</span>
                  <span className="text-emerald-400 font-bold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Egress ({egressAmount} TB)</span>
                  <span className="text-rose-400 font-bold">${s3EgressCost.toFixed(2)}/mo</span>
                  <span className="text-emerald-400 font-bold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Self-Hosted VPS</span>
                  <span className="text-slate-400">$0.00</span>
                  <span className="text-sky-400 font-bold">$5.00/mo</span>
                </div>
              </div>
            </div>

            {/* Right Column: Big Savings Card */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl">
              <div className="space-y-1">
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">Estimated Net Savings</span>
                <p className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
                  ${monthlySavings.toFixed(0)}
                  <span className="text-xs font-normal text-slate-400 font-sans"> / month</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Annual Savings:</span>
                  <span className="font-bold font-mono text-emerald-300">${annualSavings.toFixed(0)} / yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AWS S3 Monthly:</span>
                  <span className="font-mono text-rose-400">${s3TotalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TeleCloud Monthly:</span>
                  <span className="font-mono text-emerald-400">$5.00 (VPS only)</span>
                </div>
              </div>

              <button
                onClick={onConnectClick}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
              >
                <span>Deploy Free on Your VPS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Core Benefits Matrix */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 pb-8">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">Unrivaled Efficiency</span>
          <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-950'}`}>
            6 Architectural Pillars of TeleCloud
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coreBenefits.map((b, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl ${cardBg} space-y-4 text-left group hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${b.gradient} flex items-center justify-center shadow-lg ${b.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  {b.icon}
                </div>
                <span className="text-xs font-mono font-bold text-emerald-500">{b.subtitle}</span>
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{b.title}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`p-8 rounded-3xl ${cardBg} space-y-6`}>
          <div className="text-center space-y-2">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              TeleCloud vs Traditional Cloud Providers
            </h3>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Side-by-side feature and cost comparison against AWS S3, Wasabi, and Google Cloud Storage.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <th className="py-3 px-4 font-bold">Metric / Feature</th>
                  <th className="py-3 px-4 font-bold text-emerald-500">TeleCloud (MTProto)</th>
                  <th className="py-3 px-4 font-bold text-slate-500">AWS S3 Standard</th>
                  <th className="py-3 px-4 font-bold text-slate-500">Wasabi Hot Cloud</th>
                  <th className="py-3 px-4 font-bold text-slate-500">Google Cloud (GCS)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                <tr>
                  <td className="py-3 px-4 font-medium">Storage Cost (per TB/mo)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$0.00 / TB</td>
                  <td className="py-3 px-4">$23.00 / TB</td>
                  <td className="py-3 px-4">$6.99 / TB</td>
                  <td className="py-3 px-4">$20.00 / TB</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Egress Bandwidth (per TB)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$0.00 (Unlimited)</td>
                  <td className="py-3 px-4">$90.00 / TB</td>
                  <td className="py-3 px-4">Subject to Egress caps</td>
                  <td className="py-3 px-4">$120.00 / TB</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">HTTP 206 Partial Streaming</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Native On-the-Fly Range</td>
                  <td className="py-3 px-4">Standard S3 Range</td>
                  <td className="py-3 px-4">Standard S3 Range</td>
                  <td className="py-3 px-4">Standard GCS Range</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">API Requests (GET/PUT)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">100% Free / Unbilled</td>
                  <td className="py-3 px-4">$0.005 per 1,000 reqs</td>
                  <td className="py-3 px-4">Free with quota</td>
                  <td className="py-3 px-4">$0.004 per 1,000 reqs</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Self-Hosted MySQL Catalog</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Included (Local / RDS)</td>
                  <td className="py-3 px-4">Requires DynamoDB / RDS ($)</td>
                  <td className="py-3 px-4">Requires external DB ($)</td>
                  <td className="py-3 px-4">Requires Cloud SQL ($)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Max Single File Payload</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">2,000 MB (4,000 MB Premium)</td>
                  <td className="py-3 px-4">5,000 GB</td>
                  <td className="py-3 px-4">5,000 GB</td>
                  <td className="py-3 px-4">5,000 GB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
