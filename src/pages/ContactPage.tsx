import React, { useState } from 'react';
import {
  Mail,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  ExternalLink,
  ShieldCheck,
  LifeBuoy,
  Clock,
  Radio,
  FileQuestion,
} from 'lucide-react';

interface PageProps {
  darkMode: boolean;
  onConnectClick: () => void;
  navigate: (path: string) => void;
}

export default function ContactPage({ darkMode, onConnectClick, navigate }: PageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Technical Support',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    ticketId?: string;
    message: string;
  } | null>(null);

  const cardBg = darkMode
    ? 'bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 text-slate-100 shadow-xl'
    : 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 text-slate-900 shadow-xs';

  const inputBg = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500 focus:ring-sky-500/20'
    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-sky-500/20';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitResult({
        success: false,
        message: 'Please fill out all required fields (Name, Email, Message).',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitResult({
          success: true,
          ticketId: data.ticketId,
          message: data.message || 'Inquiry submitted successfully.',
        });
        setFormData({
          name: '',
          email: '',
          category: 'Technical Support',
          subject: '',
          message: '',
        });
      } else {
        setSubmitResult({
          success: false,
          message: data.message || data.error || 'Failed to submit inquiry.',
        });
      }
    } catch (err: any) {
      setSubmitResult({
        success: false,
        message: 'Network error communicating with the TeleCloud server: ' + err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>TeleCloud Engineering Desk</span>
        </div>

        <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          Contact & <span className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">Technical Support.</span>
        </h1>

        <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'} max-w-2xl mx-auto`}>
          Have questions regarding VPS deployment, MTProto authentication, MySQL schema indexing, or custom streaming setups? We are here to assist.
        </p>
      </div>

      {/* Main Form & Support Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Contact Form */}
          <div className={`lg:col-span-7 p-8 sm:p-10 rounded-3xl ${cardBg} space-y-6 text-left relative overflow-hidden shadow-2xl`}>
            <div className="space-y-1">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                Send Us an Inquiry
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Our technical team monitors requests and responds within 24 hours.
              </p>
            </div>

            {submitResult && (
              <div
                className={`p-4 rounded-2xl flex items-start space-x-3 text-xs border ${
                  submitResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {submitResult.success ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  {submitResult.ticketId && (
                    <p className="font-mono font-bold uppercase tracking-wider text-emerald-300">
                      Ticket Assigned: #{submitResult.ticketId}
                    </p>
                  )}
                  <p className="leading-relaxed">{submitResult.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-xs outline-none transition ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-xs outline-none transition ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Inquiry Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-xs outline-none transition ${inputBg}`}
                  >
                    <option value="Technical Support">Technical & Deployment Support</option>
                    <option value="Feature Request">Feature Request & Enhancement</option>
                    <option value="Bug Report">Bug / Issue Report</option>
                    <option value="Enterprise Architecture">Enterprise & Custom Clustering</option>
                    <option value="Other">General Feedback</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VPS Range Proxying Setup"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-xs outline-none transition ${inputBg}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Detailed Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe your question, server environment, or technical inquiry in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border text-xs outline-none transition ${inputBg}`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Support Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Direct Channels & Resources */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Quick Telegram Community Channel Card */}
            <div className={`p-6 rounded-3xl ${cardBg} space-y-4`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                    Developer Community
                  </h3>
                  <p className="text-[11px] text-slate-400">Real-time collaboration with fellow builders</p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Join our Telegram open channels for live deployment tips, Python daemon updates, and community script sharing.
              </p>
              <div className="pt-1">
                <button
                  onClick={onConnectClick}
                  className="w-full py-2.5 rounded-xl bg-slate-950 dark:bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:bg-slate-750 transition flex items-center justify-center space-x-2"
                >
                  <span>Connect TeleCloud Vault</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Diagnostic Checklist */}
            <div className={`p-6 rounded-3xl ${cardBg} space-y-4`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                    Common Deployment FAQs
                  </h3>
                  <p className="text-[11px] text-slate-400">Instant troubleshooting answers</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-sky-400">Q: Port 3000 or 5050 already in use?</p>
                  <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Run <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">lsof -i :3000</code> and stop conflicting processes.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-sky-400">Q: Telegram OTP not arriving?</p>
                  <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Telegram sends verification codes to your active Telegram app sessions first before SMS.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-sky-400">Q: MySQL database connection error?</p>
                  <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Ensure MySQL server is running or configure environment variables in <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">.env</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* SLA Badge */}
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-950/60 border border-slate-800' : 'bg-slate-50 border border-slate-200'} flex items-center space-x-3 text-xs`}>
              <LifeBuoy className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                Community Support SLA: Response within 24–48 hours on business days.
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
