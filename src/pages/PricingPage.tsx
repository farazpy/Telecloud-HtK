import React from 'react';
import {
  Coins,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Server,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  HelpCircle,
} from 'lucide-react';

interface PageProps {
  darkMode: boolean;
  onConnectClick: () => void;
  navigate: (path: string) => void;
}

export default function PricingPage({ darkMode, onConnectClick, navigate }: PageProps) {
  const cardBg = darkMode
    ? 'bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 text-slate-100 shadow-xl'
    : 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 text-slate-900 shadow-xs';

  const plans = [
    {
      name: 'Community Self-Hosted',
      tagline: '100% Free & Open Source Core',
      price: '$0',
      period: 'forever',
      popular: true,
      description: 'Full software functionality running on your own VPS. Zero subscription fees, zero telemetry, unlimited storage.',
      features: [
        'Unlimited File Storage Capacity',
        'HTTP 206 Partial Content Streamer',
        'Self-Hosted MySQL Catalog Indexing',
        'Password-Protected File Vaults',
        'Configurable TTL Expiration Timers',
        'Multi-Workspace Environment Isolation',
        'Interactive REST API & Python Daemon',
      ],
      buttonText: 'Deploy On Your Server',
      action: onConnectClick,
    },
    {
      name: 'Managed VPS Appliance',
      tagline: 'Turnkey Dedicated Node',
      price: '$5',
      period: 'per month',
      popular: false,
      description: 'Deploy on your favorite cloud provider (Hetzner, DigitalOcean, Linode, AWS Lightsail) with one click.',
      features: [
        'Everything in Community Core',
        'Pre-configured MySQL Database',
        'Systemd Telethon Auto-Restart Daemon',
        'SSL / Let\'s Encrypt Auto-Renewal',
        'Automated Database Snapshots',
        'Custom Domain Proxy Support',
        'Community Forum Support',
      ],
      buttonText: 'View Setup Guide',
      action: () => navigate('/features'),
    },
    {
      name: 'Enterprise Cluster',
      tagline: 'Custom High-Throughput Setup',
      price: 'Custom',
      period: 'tailored',
      popular: false,
      description: 'Multi-region MTProto worker pools, dedicated caching layers, and high-concurrency stream proxies.',
      features: [
        'Multi-Region Node Clustering',
        'Parallel MTProto Worker Daemons',
        'Custom Redis Stream Edge Caching',
        'Dedicated SLA & Technical Support',
        'White-label Custom Player UI',
        'Custom Database Migration Assistance',
        'Custom Telethon Bot Integration',
      ],
      buttonText: 'Contact Enterprise Team',
      action: () => navigate('/contact'),
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Transparent & Predictable Economics</span>
        </div>

        <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          $0 Storage. $0 Bandwidth. <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 bg-clip-text text-transparent">Zero Surprises.</span>
        </h1>

        <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'} max-w-3xl mx-auto`}>
          TeleCloud is free, self-hosted software. You never pay per gigabyte stored or per terabyte streamed. The only cost is your own $3-$5/month VPS host.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl ${cardBg} flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? 'ring-2 ring-emerald-500 shadow-2xl shadow-emerald-500/10 -translate-y-2'
                  : 'hover:-translate-y-1'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow-md">
                  Most Popular
                </div>
              )}

              <div className="space-y-6 text-left">
                <div className="space-y-1">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                    {plan.name}
                  </h3>
                  <p className="text-xs text-emerald-500 font-mono font-bold">{plan.tagline}</p>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className={`text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ {plan.period}</span>
                </div>

                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {plan.description}
                </p>

                <div className={`pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'} space-y-3`}>
                  <p className="text-[11px] font-mono uppercase font-bold text-slate-400">Included Features:</p>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={plan.action}
                className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
                    : darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
              >
                <span>{plan.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Banner */}
      <div className="max-w-4xl mx-auto px-4">
        <div className={`p-8 rounded-3xl ${cardBg} text-left flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="space-y-1">
            <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Have questions regarding deployment or licensing?
            </h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Our team is happy to assist with custom hosting setups, database configurations, and performance optimization.
            </p>
          </div>
          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
          >
            Get in Touch
          </button>
        </div>
      </div>
    </div>
  );
}
