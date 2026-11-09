import React, { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Folder,
  Play,
  Film,
  Zap,
  Smartphone,
  Bot,
  Layers,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { COUNTRIES, CountryInfo } from "../App";

export interface OnboardingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onLogout?: () => void;
  darkMode: boolean;
  webUser: any;
  setWebUser: (user: any) => void;
  connected: boolean;
  telegramUser: any;
  checkStatus: () => Promise<any>;
  fetchWorkspaces: () => Promise<any>;
  workspaces: any[];
  activeWorkspace: any;
  setActiveWorkspace: (ws: any) => void;
}

export default function OnboardingFlowModal({
  isOpen,
  onClose,
  onComplete,
  onLogout,
  darkMode,
  webUser,
  setWebUser,
  connected,
  telegramUser,
  checkStatus,
  fetchWorkspaces,
  workspaces,
  activeWorkspace,
  setActiveWorkspace,
}: OnboardingFlowModalProps) {
  // Step 1: Preferences (Questions), Step 2: Telegram (Mandatory), Step 3: Workspace (Compulsory), Step 4: Link Storage Chat, Step 5: Ready Instructions
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: 3 Basic Questions state
  const [q1UseCase, setQ1UseCase] = useState<string>("media");
  const [q2StorageSize, setQ2StorageSize] = useState<string>("medium");
  const [q3UploadPref, setQ3UploadPref] = useState<string>("uncompressed");

  // Step 2: Telegram Connection state
  const [tgMethod, setTgMethod] = useState<"phone" | "bot">("phone");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(
    COUNTRIES[0],
  );
  const [nationalPhone, setNationalPhone] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [twoFaPassword, setTwoFaPassword] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState("");
  const [tgLoading, setTgLoading] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Step 3: Workspace state
  const [wsName, setWsName] = useState("");
  const [wsCategory, setWsCategory] = useState("general");
  const [wsError, setWsError] = useState<string | null>(null);

  // Step 4: Link Storage Chat state
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [availableChats, setAvailableChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>("me");
  const [customChatInput, setCustomChatInput] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [createdWorkspace, setCreatedWorkspace] = useState<any>(null);

  // Auto-set smart workspace name when entering Step 3 based on Question 1
  useEffect(() => {
    if (!wsName) {
      if (q1UseCase === "media") setWsName("4K Media & Video Vault");
      else if (q1UseCase === "devops") setWsName("DevOps & Server Backups");
      else if (q1UseCase === "design") setWsName("Design & RAW Photo Archive");
      else setWsName("Personal Cloud Vault");
    }
  }, [q1UseCase, wsName]);

  // Ref to ensure initial step calculation only happens ONCE when opening the modal
  const initialStepSetRef = React.useRef(false);

  // Handle initial step calculation only upon modal opening
  useEffect(() => {
    if (isOpen) {
      if (!initialStepSetRef.current) {
        initialStepSetRef.current = true;
        if (webUser) {
          if (!connected) {
            // Logged in but Telegram not connected -> Step 2
            setCurrentStep(2);
          } else if (!activeWorkspace && workspaces.length === 0) {
            // Connected but no workspace -> Step 3
            setCurrentStep(3);
          } else {
            // Default start at Step 1 (Preferences)
            setCurrentStep(1);
          }
        } else {
          setCurrentStep(1);
        }
      }
    } else {
      initialStepSetRef.current = false;
    }
  }, [isOpen]);

  // Trigger chat fetch when entering Step 4
  useEffect(() => {
    if (currentStep === 4 && isOpen) {
      loadUserChats();
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  // Safe helper for API requests
  const safeFetch = async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("telecloud_web_token");
    const headers: Record<string, string> = {
      ...((opts?.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
    }
    const res = await fetch(url, { ...opts, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        json.error ||
          json.message ||
          `Request failed with status ${res.status}`,
      );
    }
    return json;
  };

  // Handle Mini Logout / Account Switch
  const handleLogout = async () => {
    try {
      await safeFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } catch {}
    localStorage.removeItem("telecloud_web_token");
    setWebUser(null);
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  // -------------------------------------------------------------
  // Step 2: Telegram Connection Handlers
  // -------------------------------------------------------------
  const handleSendTelegramCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgError(null);
    const cleanDigits = nationalPhone.replace(/[^\d]/g, "");
    if (!cleanDigits) {
      setTgError("Please enter your national phone number.");
      return;
    }
    const fullPhone =
      selectedCountry.dialCode === "+"
        ? `+${cleanDigits}`
        : `${selectedCountry.dialCode}${cleanDigits}`;

    setTgLoading(true);
    try {
      const data = await safeFetch("/api/send_code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          storage_chat: "me",
        }),
      });
      if (data?.phone_code_hash) {
        setPhoneCodeHash(data.phone_code_hash);
      } else {
        throw new Error(data?.error || "Failed to send verification code.");
      }
    } catch (err: any) {
      setTgError(err.message);
    } finally {
      setTgLoading(false);
    }
  };

  const handleVerifyTelegramCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgError(null);
    if (!otpCode.trim()) {
      setTgError("Please enter the code sent to your Telegram account.");
      return;
    }
    const cleanDigits = nationalPhone.replace(/[^\d]/g, "");
    const fullPhone =
      selectedCountry.dialCode === "+"
        ? `+${cleanDigits}`
        : `${selectedCountry.dialCode}${cleanDigits}`;

    setTgLoading(true);
    try {
      const data = await safeFetch("/api/sign_in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          code: otpCode.trim(),
          phone_code_hash: phoneCodeHash,
          password: twoFaPassword || undefined,
        }),
      });

      if (data?.requires_password) {
        setNeeds2FA(true);
        setTgError(
          "This Telegram account is protected by 2-Step Verification. Enter your cloud password below.",
        );
        return;
      }

      await checkStatus();
      await fetchWorkspaces().catch(() => {});
      setPhoneCodeHash(null);
      setOtpCode("");
      setTwoFaPassword("");
      setNeeds2FA(false);
      // Advance to Step 3 (Workspace)
      setCurrentStep(3);
    } catch (err: any) {
      setTgError(err.message || "Verification failed. Please check the code.");
    } finally {
      setTgLoading(false);
    }
  };

  const handleConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgError(null);
    const cleanToken = botTokenInput.trim();
    if (!cleanToken) {
      setTgError("Please enter a valid Telegram Bot Token.");
      return;
    }

    setTgLoading(true);
    try {
      const data = await safeFetch("/api/connect_bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: cleanToken,
          storage_chat: "me",
        }),
      });
      if (data?.error) throw new Error(data.error);
      await checkStatus();
      setCurrentStep(3);
    } catch (err: any) {
      setTgError(err.message || "Failed to connect via Bot Token.");
    } finally {
      setTgLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 4: Fetch Existing Chats for Linking
  // -------------------------------------------------------------
  const loadUserChats = async () => {
    setChatsLoading(true);
    setChatsError(null);
    try {
      const data = await safeFetch("/api/storage/chats");
      const dialogs = data?.dialogs || [];
      setAvailableChats(dialogs);
      if (dialogs.length > 0) {
        setSelectedChat(dialogs[0].id || "me");
      }
    } catch (err: any) {
      setChatsError(
        'Could not auto-fetch Telegram channels. You can use "Saved Messages" or enter a chat ID.',
      );
      setAvailableChats([
        {
          id: "me",
          title: "Saved Messages (Personal Cloud)",
          type: "self",
          is_self: true,
          description: "Your default 100% private Telegram storage chat",
        },
      ]);
    } finally {
      setChatsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 4 Finalizer: Create Workspace & Link Storage
  // -------------------------------------------------------------
  const handleCreateAndLinkWorkspace = async () => {
    setWsError(null);
    const finalChat =
      selectedChat === "custom" ? customChatInput.trim() : selectedChat;
    if (!finalChat) {
      setWsError("Please select or specify a target storage chat.");
      return;
    }
    const finalName = wsName.trim() || "My Personal Cloud";

    setLinkLoading(true);
    try {
      const res = await safeFetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          storage_chat: finalChat,
        }),
      });

      if (res?.workspace) {
        setCreatedWorkspace(res.workspace);
        setActiveWorkspace(res.workspace);
        await fetchWorkspaces();
      }
      setCurrentStep(5);
    } catch (err: any) {
      setWsError(err.message || "Failed to create workspace.");
    } finally {
      setLinkLoading(false);
    }
  };

  // Filter countries for country code dropdown
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-md bg-black/60 transition-all duration-300">
      {/* Modal Surface */}
      <div
        className={`w-full max-w-2xl rounded-[32px] overflow-hidden border relative transition-all duration-300 ${
          darkMode
            ? "bg-black/95 border-white/10 text-white "
            : "bg-white/95 border-slate-200 text-slate-900"
        }`}
      >
        {/* Top Header with Telegram Brand */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#38bdf8] flex items-center justify-center text-white ">
              <svg
                className="w-5 h-5 fill-current transform -rotate-12 translate-x-0.2"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm tracking-tight">
                  TeleCloud
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#0088cc]/10 text-[#0088cc]">
                  Onboarding
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Step {currentStep} of 5
              </p>
            </div>
          </div>

          {/* Mini Account & Logout Option */}
          <div className="flex items-center space-x-2.5">
            {webUser && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                  {webUser.username || webUser.email || "Cloud User"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {webUser.email ? "Connected" : `@${webUser.username}`}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title="Log out or switch account"
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* 5-Step Visual Progress Stepper Bar */}
        <div className="px-6 sm:px-8 py-3 bg-slate-50/50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
            <span className={currentStep >= 1 ? "text-[#0088cc]" : ""}>
              1. Preferences
            </span>
            <span className={currentStep >= 2 ? "text-[#0088cc]" : ""}>
              2. Telegram
            </span>
            <span className={currentStep >= 3 ? "text-[#0088cc]" : ""}>
              3. Workspace
            </span>
            <span className={currentStep >= 4 ? "text-[#0088cc]" : ""}>
              4. Storage
            </span>
            <span className={currentStep >= 5 ? "text-[#0088cc]" : ""}>
              5. Ready
            </span>
          </div>

          {/* Animated Gradient Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#0a0a0a] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0088cc] via-[#00a2ed] to-[#38bdf8] transition-all duration-500 rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 max-h-[72vh] overflow-y-auto">
          {/* ========================================================= */}
          {/* STEP 1: 3 BASIC QUESTIONS (PREFERENCES) */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0088cc]">
                  Personalization
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Tell us about your storage needs
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We'll tailor your cloud engine and recommended storage
                  channels based on your choices.
                </p>
              </div>

              {/* Question 1 */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  1. What will you primarily store on TeleCloud?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: "media",
                      title: "4K Videos & Streaming",
                      desc: "Movies, YouTube renders, ProRes",
                    },
                    {
                      id: "devops",
                      title: "DevOps & Backups",
                      desc: "Database dumps, tarballs, logs",
                    },
                    {
                      id: "design",
                      title: "Design & RAW Photos",
                      desc: "CR3, Figma, PSD asset packs",
                    },
                    {
                      id: "family",
                      title: "Personal & Family Vault",
                      desc: "Family albums, scanned records",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQ1UseCase(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 ${
                        q1UseCase === opt.id
                          ? "border-[#0088cc] bg-sky-50/70 dark:bg-sky-950/30"
                          : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0a0a0a]/40"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          q1UseCase === opt.id
                            ? "border-[#0088cc] bg-[#0088cc]"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {q1UseCase === opt.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{opt.title}</p>
                        <p className="text-[10px] text-slate-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  2. What is your estimated storage volume?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "small", title: "< 500 GB", desc: "Everyday" },
                    { id: "medium", title: "500 GB – 2 TB", desc: "Creator" },
                    {
                      id: "massive",
                      title: "2 TB – 10 TB+",
                      desc: "Archivist",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQ2StorageSize(opt.id)}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer space-y-1 ${
                        q2StorageSize === opt.id
                          ? "border-[#0088cc] bg-sky-50/70 dark:bg-sky-950/30"
                          : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0a0a0a]/40"
                      }`}
                    >
                      <p className="text-xs font-black">{opt.title}</p>
                      <p className="text-[10px] text-slate-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  3. Preferred upload optimization?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: "uncompressed",
                      title: "Bit-for-Bit RAW",
                      desc: "Zero compression",
                    },
                    {
                      id: "stream",
                      title: "Instant Stream",
                      desc: "Byte-range scrub",
                    },
                    {
                      id: "isolated",
                      title: "Isolated Vaults",
                      desc: "Multi-channel",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQ3UploadPref(opt.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer space-y-1 ${
                        q3UploadPref === opt.id
                          ? "border-[#0088cc] bg-sky-50/70 dark:bg-sky-950/30"
                          : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0a0a0a]/40"
                      }`}
                    >
                      <p className="text-xs font-black">{opt.title}</p>
                      <p className="text-[10px] text-slate-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out / Switch Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-full font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition cursor-pointer flex items-center space-x-2 "
                >
                  <span>Connect Telegram Account →</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: CONNECT TELEGRAM (MANDATORY) */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    Mandatory Step
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Telegram MTProto Link
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Connect Your Telegram Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  TeleCloud stores your data within your own personal Telegram
                  cloud. Connecting your account is required to activate
                  unlimited storage.
                </p>
              </div>

              {/* Already Connected Card */}
              {connected && telegramUser ? (
                <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center font-black text-base ">
                      {telegramUser.first_name
                        ? telegramUser.first_name[0]
                        : "T"}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-black text-slate-900'dark:text-white">
                          {telegramUser.first_name}{" "}
                          {telegramUser.last_name || ""}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {telegramUser.username
                          ? `@${telegramUser.username}`
                          : `ID: ${telegramUser.id}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-full py-3 rounded-full font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>Create Your Workspace →</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Connection Method Toggle */}
                  <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-[#0a0a0a]/80 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTgMethod("phone")}
                      className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                        tgMethod === "phone"
                          ? "bg-white dark:bg-[#111111] text-[#0088cc] "
                          : "text-slate-500"
                      }`}
                    >
                      Phone & Telegram OTP (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTgMethod("bot")}
                      className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                        tgMethod === "bot"
                          ? "bg-white dark:bg-[#111111] text-[#0088cc] "
                          : "text-slate-500"
                      }`}
                    >
                      Bot Token (Server / Bot)
                    </button>
                  </div>

                  {tgError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{tgError}</span>
                    </div>
                  )}

                  {/* Method A: Phone OTP */}
                  {tgMethod === "phone" && (
                    <div className="space-y-3">
                      {!phoneCodeHash ? (
                        <form
                          onSubmit={handleSendTelegramCode}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Phone Number
                            </label>

                            <div className="flex rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-[#0a0a0a]/70">
                              {/* Country Selector Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCountryPicker(!showCountryPicker)
                                }
                                className="px-3 py-2.5 bg-slate-50 dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-white/10 flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
                              >
                                <span>{selectedCountry.flag}</span>
                                <span>{selectedCountry.dialCode}</span>
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              </button>

                              <input
                                type="tel"
                                value={nationalPhone}
                                onChange={(e) =>
                                  setNationalPhone(e.target.value)
                                }
                                placeholder={selectedCountry.example}
                                required
                                className="flex-1 px-3 py-2.5 text-xs font-medium focus:outline-none bg-transparent"
                              />
                            </div>

                            {/* Country Dropdown Modal/List */}
                            {showCountryPicker && (
                              <div className="mt-2 p-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black max-h-48 overflow-y-auto space-y-1">
                                <input
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) =>
                                    setCountrySearch(e.target.value)
                                  }
                                  placeholder="Search country..."
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs mb-1"
                                />
                                {filteredCountries.slice(0, 15).map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setShowCountryPicker(false);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#0a0a0a] cursor-pointer"
                                  >
                                    <span>
                                      {c.flag} {c.name}
                                    </span>
                                    <span className="font-mono text-slate-400">
                                      {c.dialCode}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={tgLoading}
                            className="w-full py-3.5 rounded-full font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 "
                          >
                            <span>
                              {tgLoading
                                ? "Sending Verification Code..."
                                : "Send Telegram Login Code →"}
                            </span>
                          </button>
                        </form>
                      ) : (
                        <form
                          onSubmit={handleVerifyTelegramCode}
                          className="space-y-3 animate-fadeIn"
                        >
                          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-xs">
                            <p className="font-bold text-[#0088cc]">
                              Login code sent!
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              Check your Telegram app messages for the 5-digit
                              verification code.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              5-Digit Telegram Code
                            </label>
                            <input
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="12345"
                              required
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[#0088cc]"
                            />
                          </div>

                          {needs2FA && (
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Telegram 2FA Password
                              </label>
                              <input
                                type="password"
                                value={twoFaPassword}
                                onChange={(e) =>
                                  setTwoFaPassword(e.target.value)
                                }
                                placeholder="Your Telegram 2-Step Verification Password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 text-xs focus:outline-none focus:border-[#0088cc]"
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setPhoneCodeHash(null)}
                              className="px-4 py-3 rounded-full border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                            >
                              Change Number
                            </button>
                            <button
                              type="submit"
                              disabled={tgLoading}
                              className="flex-1 py-3 rounded-full font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 "
                            >
                              <span>
                                {tgLoading
                                  ? "Verifying..."
                                  : "Verify & Continue →"}
                              </span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Method B: Bot Token */}
                  {tgMethod === "bot" && (
                    <form onSubmit={handleConnectBot} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Telegram Bot Token (from @BotFather)
                        </label>
                        <input
                          type="password"
                          value={botTokenInput}
                          onChange={(e) => setBotTokenInput(e.target.value)}
                          placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 text-xs font-mono focus:outline-none focus:border-[#0088cc]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={tgLoading}
                        className="w-full py-3.5 rounded-full font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 "
                      >
                        <span>
                          {tgLoading
                            ? "Connecting Bot..."
                            : "Connect Telegram Bot →"}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-start">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: CREATE WORKSPACE (COMPULSORY) */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0088cc]">
                  Compulsory Configuration
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Create Your First Workspace
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Workspaces isolate and categorize your files into dedicated
                  Telegram channels.
                </p>
              </div>

              {wsError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{wsError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    placeholder="e.g. My Personal Cloud"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 text-xs font-bold focus:outline-none focus:border-[#0088cc]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Category Icon
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "general", label: "📁 General", icon: Folder },
                      { id: "media", label: "🎬 Media", icon: Film },
                      { id: "devops", label: "💻 DevOps", icon: Bot },
                      { id: "design", label: "🎨 Design", icon: Layers },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setWsCategory(cat.id)}
                        className={`p-3 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                          wsCategory === cat.id
                            ? "border-[#0088cc] bg-sky-50 dark:bg-sky-950/40 text-[#0088cc]"
                            : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0a0a]/40 border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-400">
                  Slug:{" "}
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {wsName.toLowerCase().replace(/[^a-z0-9]/g, "-") ||
                      "workspace"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!wsName.trim()) {
                      setWsError("Please enter a workspace name.");
                      return;
                    }
                    setCurrentStep(4);
                  }}
                  className="px-6 py-3 rounded-full font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition cursor-pointer flex items-center space-x-2 "
                >
                  <span>Next: Link Storage Chat →</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: LINK CHAT / CHANNEL TO WORKSPACE */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0088cc]">
                  Storage Target
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Link a Telegram Chat or Channel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select where files uploaded to "{wsName}" will be physically
                  stored in Telegram.
                </p>
              </div>

              {chatsError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{chatsError}</span>
                </div>
              )}

              {chatsLoading ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#0088cc] border-t-transparent animate-spin" />
                  <p className="text-xs text-slate-400">
                    Fetching your Telegram channels and chats...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Option 1: Saved Messages (me) */}
                  <div
                    onClick={() => setSelectedChat("me")}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-3.5 ${
                      selectedChat === "me"
                        ? "border-[#0088cc] bg-sky-50/70 dark:bg-sky-950/30"
                        : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0a0a0a]/40"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center shrink-0 ${
                        selectedChat === "me"
                          ? "border-[#0088cc] bg-[#0088cc]"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedChat === "me" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black">
                          Saved Messages (`me`)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Recommended & Default
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Your built-in personal Telegram cloud folder. 100%
                        private and accessible on all your devices.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Fetched Existing Channels */}
                  {availableChats
                    .filter((c) => c.id !== "me")
                    .slice(0, 5)
                    .map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(String(chat.id))}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start space-x-3.5 ${
                          selectedChat === String(chat.id)
                            ? "border-[#0088cc] bg-sky-50/70 dark:bg-sky-950/30"
                            : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0a0a0a]/40"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center shrink-0 ${
                            selectedChat === String(chat.id)
                              ? "border-[#0088cc] bg-[#0088cc]"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedChat === String(chat.id) && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-xs font-black">
                            {chat.title || "Private Channel"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ID: {chat.id}
                          </p>
                        </div>
                      </div>
                    ))}

                  {/* Option 3: Custom Chat ID */}
                  <div
                    onClick={() => setSelectedChat("custom")}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      selectedChat === "custom"
                        ? "border-[#0088cc] bg-sky-50/70 dark:bg-sky-950/30"
                        : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0a0a0a]/40"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedChat === "custom"
                            ? "border-[#0088cc] bg-[#0088cc]"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {selectedChat === "custom" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-black">
                        Custom Channel or Supergroup ID
                      </span>
                    </div>

                    {selectedChat === "custom" && (
                      <input
                        type="text"
                        value={customChatInput}
                        onChange={(e) => setCustomChatInput(e.target.value)}
                        placeholder="-1001234567890"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-mono bg-white dark:bg-black focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateAndLinkWorkspace}
                  disabled={linkLoading}
                  className="px-6 py-3 rounded-full font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition cursor-pointer flex items-center space-x-2 "
                >
                  <span>
                    {linkLoading
                      ? "Linking Workspace..."
                      : "Link & Complete Setup →"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 5: INSTRUCTIONS & LAUNCH */}
          {/* ========================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 ">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-black">You're All Set!</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your Telegram cloud workspace "{wsName}" is live and ready.
                  Here is how to make the most of it:
                </p>
              </div>

              {/* 4 Interactive Instruction Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-[#0088cc] flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    1. Drag & Drop Uploads
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Drop single files up to 2GB (or 4GB with Telegram Premium)
                    directly into your dashboard.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    2. Instant Video Streaming
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Play 4K MKV, MP4, and FLAC files instantly in your browser
                    with zero buffer wait times.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    3. Real-Time Phone Sync
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Forward any file to your linked chat in Telegram mobile app
                    — it instantly appears on web!
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    4. Direct Share Links
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Generate public streaming links for your friends or
                    colleagues with zero bandwidth caps.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(
                      "telecloud_onboarding_completed",
                      "true",
                    );
                    onComplete();
                  }}
                  className="w-full py-4 rounded-full font-black text-sm text-white bg-gradient-to-r from-[#0088cc] via-[#00a2ed] to-[#38bdf8] hover:opacity-95 active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Launch My Cloud Drive 🚀</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
