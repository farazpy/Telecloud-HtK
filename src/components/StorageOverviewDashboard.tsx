import React, { useState, useRef, useMemo } from "react";
import {
  Folder,
  Image as ImageIcon,
  Video,
  FileText,
  UploadCloud,
  FolderUp,
  Send,
  Link2,
  MoreVertical,
  ArrowRight,
  TrendingUp,
  Download,
  Eye,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Plus,
  FileArchive,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export interface StorageFile {
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
}

interface StorageOverviewDashboardProps {
  darkMode: boolean;
  user: any;
  webUser: any;
  files: StorageFile[];
  stats: any;
  storageChat: string;
  activeWorkspace: any;
  formatBytes: (bytes: number) => string;
  onNavigateTab: (tab: string, filter?: string) => void;
  onStreamFile: (file: StorageFile) => void;
  onDeleteFile: (file: StorageFile) => void;
  onCopyLink: (file: StorageFile) => void;
  overviewFiles: any[];
  overviewUploading: boolean;
  overviewActiveIndex: number;
  addFilesToOverviewQueue: (files: FileList | File[]) => void;
  startOverviewBatchUpload: () => void;
  clearCompletedOverviewQueue: () => void;
  clearAllOverviewQueue: () => void;
}

export const StorageOverviewDashboard: React.FC<
  StorageOverviewDashboardProps
> = ({
  darkMode,
  user,
  webUser,
  files,
  stats,
  storageChat,
  activeWorkspace,
  formatBytes,
  onNavigateTab,
  onStreamFile,
  onDeleteFile,
  onCopyLink,
  overviewFiles,
  overviewUploading,
  overviewActiveIndex,
  addFilesToOverviewQueue,
  startOverviewBatchUpload,
  clearCompletedOverviewQueue,
  clearAllOverviewQueue,
}) => {
  const [activeFileFilter, setActiveFileFilter] = useState<
    "all" | "images" | "videos" | "documents" | "others"
  >("all");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<
    string | number | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [remoteUrlModalOpen, setRemoteUrlModalOpen] = useState(false);
  const [remoteUrlInput, setRemoteUrlInput] = useState("");
  const [remoteUrlLoading, setRemoteUrlLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Fallback showcase files when workspace is brand new or loading,
  // matching the exact look and names in the user's mockup:
  const showcaseFiles: Array<
    StorageFile & { humanDate: string; category: string }
  > = [
    {
      id: 101,
      message_id: 101,
      file_name: "Trip_to_Manali.jpg",
      file_size: 4.2 * 1024 * 1024,
      mime_type: "image/jpeg",
      humanDate: "Today, 11:24 AM",
      category: "Image",
    },
    {
      id: 102,
      message_id: 102,
      file_name: "Workout_Session.mp4",
      file_size: 482.7 * 1024 * 1024,
      mime_type: "video/mp4",
      humanDate: "Today, 10:03 AM",
      category: "Video",
    },
    {
      id: 103,
      message_id: 103,
      file_name: "Project_Proposal.pdf",
      file_size: 8.4 * 1024 * 1024,
      mime_type: "application/pdf",
      humanDate: "Yesterday, 6:45 PM",
      category: "PDF",
    },
    {
      id: 104,
      message_id: 104,
      file_name: "Backup_2026.zip",
      file_size: 2.8 * 1024 * 1024 * 1024,
      mime_type: "application/zip",
      humanDate: "Yesterday, 2:18 PM",
      category: "Archive",
    },
    {
      id: 105,
      message_id: 105,
      file_name: "Family_Photo.jpg",
      file_size: 6.1 * 1024 * 1024,
      mime_type: "image/jpeg",
      humanDate: "28 Oct 2026, 9:12 PM",
      category: "Image",
    },
  ];

  // Helper to categorize files
  const getFileCategory = (mime: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (
      mime.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)
    ) {
      return "Image";
    }
    if (
      mime.startsWith("video/") ||
      ["mp4", "mov", "mkv", "avi", "webm"].includes(ext)
    ) {
      return "Video";
    }
    if (mime.includes("pdf") || ext === "pdf") {
      return "PDF";
    }
    if (
      ["zip", "rar", "tar", "gz", "7z", "bz2"].includes(ext) ||
      mime.includes("zip") ||
      mime.includes("compressed")
    ) {
      return "Archive";
    }
    if (
      mime.startsWith("text/") ||
      ["doc", "docx", "txt", "xls", "xlsx", "ppt", "pptx"].includes(ext)
    ) {
      return "Document";
    }
    return "Other";
  };

  // Combine real user files with showcase files if user has few/no files yet
  const displayFiles = useMemo(() => {
    if (files && files.length > 0) {
      return files.map((f, idx) => {
        const cat = getFileCategory(f.mime_type || "", f.file_name);
        const dateStr = f.created_at || f.date;
        let human = "Recent";
        if (dateStr) {
          try {
            const d = new Date(dateStr);
            human = d.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            human = "Recent";
          }
        } else {
          human = idx === 0 ? "Today, 11:24 AM" : "Earlier";
        }
        return {
          ...f,
          id: f.id || idx + 1,
          humanDate: human,
          category: cat,
        };
      });
    }
    return showcaseFiles;
  }, [files]);

  // Filtered files for table
  const filteredFiles = useMemo(() => {
    if (activeFileFilter === "all") return displayFiles.slice(0, 7);
    if (activeFileFilter === "images") {
      return displayFiles.filter((f) => f.category === "Image").slice(0, 7);
    }
    if (activeFileFilter === "videos") {
      return displayFiles.filter((f) => f.category === "Video").slice(0, 7);
    }
    if (activeFileFilter === "documents") {
      return displayFiles
        .filter((f) => f.category === "PDF" || f.category === "Document")
        .slice(0, 7);
    }
    return displayFiles
      .filter((f) => f.category === "Archive" || f.category === "Other")
      .slice(0, 7);
  }, [displayFiles, activeFileFilter]);

  // Dynamic stat counts
  const statCounts = useMemo(() => {
    const totalCount = files.length > 0 ? files.length : 12846;
    let photosCount = 0;
    let videosCount = 0;
    let docsCount = 0;

    if (files.length > 0) {
      files.forEach((f) => {
        const cat = getFileCategory(f.mime_type || "", f.file_name);
        if (cat === "Image") photosCount++;
        else if (cat === "Video") videosCount++;
        else if (cat === "PDF" || cat === "Document") docsCount++;
      });
    } else {
      photosCount = 5320;
      videosCount = 3984;
      docsCount = 2910;
    }

    return {
      total: totalCount.toLocaleString(),
      photos: photosCount.toLocaleString(),
      videos: videosCount.toLocaleString(),
      docs: docsCount.toLocaleString(),
    };
  }, [files]);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToOverviewQueue(e.dataTransfer.files);
    }
  };

  const handleCopyLinkWithFeedback = (file: StorageFile) => {
    onCopyLink(file);
    const key = String(file.id || file.file_slug || file.file_name);
    setCopiedSlug(key);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => String(f.id)));
    }
  };

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Render file icon based on category
  const renderFileThumbnail = (file: StorageFile & { category: string }) => {
    if (file.category === "Image") {
      return (
        <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center shrink-0 ">
          <ImageIcon className="w-5 h-5 text-sky-500" />
        </div>
      );
    }
    if (file.category === "Video") {
      return (
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center shrink-0 ">
          <Video className="w-5 h-5 text-indigo-500" />
        </div>
      );
    }
    if (file.category === "PDF") {
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0 ">
          <FileText className="w-5 h-5 text-rose-500" />
        </div>
      );
    }
    if (file.category === "Archive") {
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0 ">
          <FileArchive className="w-5 h-5 text-amber-500" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] flex items-center justify-center shrink-0 ">
        <Folder className="w-5 h-5 text-slate-500" />
      </div>
    );
  };

  // Render badge based on category
  const renderCategoryBadge = (category: string) => {
    if (category === "Image") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-[#0088cc] border border-sky-200 dark:border-sky-800/50">
          Image
        </span>
      );
    }
    if (category === "Video") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
          Video
        </span>
      );
    }
    if (category === "PDF") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
          PDF
        </span>
      );
    }
    if (category === "Archive") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
          Archive
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#222222]">
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Hidden file & folder inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addFilesToOverviewQueue(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <input
        type="file"
        ref={folderInputRef}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addFilesToOverviewQueue(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* ============================================================== */}
      {/* TOP STAT CARDS (ROW OF 4) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Files */}
        <div
          onClick={() => onNavigateTab("vault", "all")}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer hover: hover:border-sky-300 dark:hover:border-sky-700 ${
            darkMode
              ? "bg-[#050505]/90 border-white/10"
              : "bg-white border-slate-100"
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/70 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center shrink-0 ">
              <Folder className="w-6 h-6 text-[#0088cc]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Files
              </p>
              <h3
                className={`text-2xl font-black tracking-tight mt-0.5 ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {statCounts.total}
              </h3>
              <p className="text-[11px] font-bold text-emerald-500 flex items-center space-x-1 mt-0.5">
                <span>↑ +8.4%</span>
                <span className="text-slate-400 font-normal">
                  from last 7 days
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Photos */}
        <div
          onClick={() => onNavigateTab("vault", "images")}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer hover: hover:border-purple-300 dark:hover:border-purple-700 ${
            darkMode
              ? "bg-[#050505]/90 border-white/10"
              : "bg-white border-slate-100"
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center shrink-0 ">
              <ImageIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Photos
              </p>
              <h3
                className={`text-2xl font-black tracking-tight mt-0.5 ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {statCounts.photos}
              </h3>
              <p className="text-[11px] font-bold text-emerald-500 flex items-center space-x-1 mt-0.5">
                <span>↑ +6.1%</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Videos */}
        <div
          onClick={() => onNavigateTab("vault", "videos")}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer hover: hover:border-emerald-300 dark:hover:border-emerald-700 ${
            darkMode
              ? "bg-[#050505]/90 border-white/10"
              : "bg-white border-slate-100"
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center shrink-0 ">
              <Video className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Videos
              </p>
              <h3
                className={`text-2xl font-black tracking-tight mt-0.5 ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {statCounts.videos}
              </h3>
              <p className="text-[11px] font-bold text-emerald-500 flex items-center space-x-1 mt-0.5">
                <span>↑ +12.7%</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Documents */}
        <div
          onClick={() => onNavigateTab("vault", "documents")}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer hover: hover:border-amber-300 dark:hover:border-amber-700 ${
            darkMode
              ? "bg-[#050505]/90 border-white/10"
              : "bg-white border-slate-100"
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center shrink-0 ">
              <FileText className="w-6 h-6 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Documents
              </p>
              <h3
                className={`text-2xl font-black tracking-tight mt-0.5 ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {statCounts.docs}
              </h3>
              <p className="text-[11px] font-bold text-emerald-500 flex items-center space-x-1 mt-0.5">
                <span>↑ +4.9%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MIDDLE SECTION: QUICK ACTIONS + DROPZONE & STORAGE USAGE RING */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Quick Actions + Large Dropzone */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Action Button Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition flex items-center space-x-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Files</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition flex items-center space-x-2 cursor-pointer active:scale-95 ${
                darkMode
                  ? "bg-[#050505]/90 hover:bg-[#0a0a0a] text-slate-200 border-white/10"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80"
              }`}
            >
              <FolderUp className="w-4 h-4 text-slate-500" />
              <span>Upload Folder</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("settings")}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition flex items-center space-x-2 cursor-pointer active:scale-95 ${
                darkMode
                  ? "bg-[#050505]/90 hover:bg-[#0a0a0a] text-slate-200 border-white/10"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80"
              }`}
            >
              <Send className="w-4 h-4 text-[#0088cc]" />
              <span>From Telegram</span>
            </button>

            <button
              type="button"
              onClick={() => setRemoteUrlModalOpen(true)}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition flex items-center space-x-2 cursor-pointer active:scale-95 ${
                darkMode
                  ? "bg-[#050505]/90 hover:bg-[#0a0a0a] text-slate-200 border-white/10"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80"
              }`}
            >
              <Link2 className="w-4 h-4 text-slate-500" />
              <span>Remote URL</span>
            </button>
          </div>

          {/* Large Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
              isDragging
                ? "border-[#0088cc] bg-sky-500/10 scale-[1.01]"
                : darkMode
                  ? "border-sky-900/60 hover:border-sky-600 bg-sky-950/20 hover:bg-sky-950/30"
                  : "border-sky-300 hover:border-[#0088cc] bg-sky-50/40 hover:bg-sky-50/70"
            }`}
          >
            <div className="space-y-4 max-w-md mx-auto">
              {/* Cloud Upload Icon */}
              <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mx-auto text-[#0088cc] ">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h4
                  className={`text-base sm:text-lg font-black ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Drag & drop files here
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  or click to browse
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 transition cursor-pointer"
                >
                  Choose Files
                </button>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                Supports all file types · No size limit · Uploaded to your
                Telegram
              </p>
            </div>
          </div>

          {/* Active Upload Queue Display if files are queued */}
          {overviewFiles.length > 0 && (
            <div
              className={`p-4 rounded-2xl border space-y-3 ${darkMode ? "bg-[#050505] border-white/10" : "bg-white border-slate-200"}`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center space-x-2 text-[#0088cc]">
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${overviewUploading ? "animate-spin" : ""}`}
                  />
                  <span>
                    Upload Queue ({overviewFiles.length}{" "}
                    {overviewFiles.length === 1 ? "file" : "files"})
                  </span>
                </span>
                <div className="flex items-center space-x-2">
                  {!overviewUploading && (
                    <button
                      type="button"
                      onClick={startOverviewBatchUpload}
                      className="px-3 py-1 bg-[#0088cc] text-white rounded-lg text-[11px] font-bold hover:bg-[#0077b5] transition cursor-pointer"
                    >
                      Start Upload
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearAllOverviewQueue}
                    disabled={overviewUploading}
                    className="text-[11px] text-slate-400 hover:text-rose-500 transition cursor-pointer disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {overviewUploading && (
                <div className="w-full bg-slate-100 dark:bg-[#0a0a0a] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#0088cc] h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (overviewFiles.reduce(
                          (acc, f) =>
                            acc +
                            (f.status === "completed"
                              ? 100
                              : f.status === "uploading"
                                ? f.progress
                                : 0),
                          0,
                        ) /
                          (overviewFiles.length * 100)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              )}

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {overviewFiles.map((qFile, qIdx) => (
                  <div
                    key={qIdx}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      darkMode
                        ? "bg-black/60 border-white/10"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">
                        {qFile.file?.name || qFile.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {formatBytes(qFile.size || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Storage Usage Ring & Breakdown */}
        <div className="lg:col-span-5">
          <div
            className={`p-6 rounded-3xl border transition-all duration-200 ${
              darkMode
                ? "bg-[#050505]/90 border-white/10"
                : "bg-white border-slate-100"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-base font-black ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Storage Usage
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("analytics")}
                className="text-xs font-bold text-[#0088cc] hover:text-[#0077b5] flex items-center space-x-1 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Donut Chart & Legend */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Donut Ring with Infinity Symbol in Center */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke={darkMode ? "#1e293b" : "#f1f5f9"}
                    strokeWidth="11"
                    fill="transparent"
                  />
                  {/* Segment 1: Photos (41.2%) - #0088cc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#0088cc"
                    strokeWidth="11"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - 0.412)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  {/* Segment 2: Videos (32.4%) - #6366f1 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#6366f1"
                    strokeWidth="11"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - 0.324)}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      transform: "rotate(148deg)",
                      transformOrigin: "50% 50%",
                    }}
                  />
                  {/* Segment 3: Documents (18.7%) - #f59e0b */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#f59e0b"
                    strokeWidth="11"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - 0.187)}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      transform: "rotate(265deg)",
                      transformOrigin: "50% 50%",
                    }}
                  />
                  {/* Segment 4: Other Files (7.7%) - #94a3b8 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#94a3b8"
                    strokeWidth="11"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - 0.077)}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      transform: "rotate(332deg)",
                      transformOrigin: "50% 50%",
                    }}
                  />
                </svg>

                {/* Central glowing infinity icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-3xl font-black text-[#0088cc] leading-none drop-">
                    ∞
                  </span>
                </div>
              </div>

              {/* Text Breakdown */}
              <div className="space-y-3.5 flex-1 w-full text-left">
                <div>
                  <h4
                    className={`text-base font-black ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Unlimited Storage
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Using your personal Telegram account
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Photos */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#0088cc] shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Photos
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                    >
                      125.4 GB{" "}
                      <span className="text-slate-400 font-normal">
                        (41.2%)
                      </span>
                    </span>
                  </div>

                  {/* Videos */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1] shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Videos
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                    >
                      98.7 GB{" "}
                      <span className="text-slate-400 font-normal">
                        (32.4%)
                      </span>
                    </span>
                  </div>

                  {/* Documents */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Documents
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                    >
                      56.9 GB{" "}
                      <span className="text-slate-400 font-normal">
                        (18.7%)
                      </span>
                    </span>
                  </div>

                  {/* Other Files */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#94a3b8] shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Other Files
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                    >
                      23.1 GB{" "}
                      <span className="text-slate-400 font-normal">(7.7%)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BOTTOM SECTION: RECENT FILES & RECENT ACTIVITY */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Recent Files */}
        <div className="lg:col-span-7">
          <div
            className={`p-6 rounded-3xl border transition-all duration-200 space-y-4 ${
              darkMode
                ? "bg-[#050505]/90 border-white/10"
                : "bg-white border-slate-100"
            }`}
          >
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3
                className={`text-base font-black ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Recent Files
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("vault")}
                className="text-xs font-bold text-[#0088cc] hover:text-[#0077b5] flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0a0a0a]/80 w-fit">
              <button
                type="button"
                onClick={() => setActiveFileFilter("all")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeFileFilter === "all"
                    ? "bg-[#0088cc] text-white "
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>All Files</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFileFilter("images")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeFileFilter === "images"
                    ? "bg-[#0088cc] text-white "
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFileFilter("videos")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeFileFilter === "videos"
                    ? "bg-[#0088cc] text-white "
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFileFilter("documents")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeFileFilter === "documents"
                    ? "bg-[#0088cc] text-white "
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documents</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFileFilter("others")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeFileFilter === "others"
                    ? "bg-[#0088cc] text-white "
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Others</span>
              </button>
            </div>

            {/* File Table */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/10 text-slate-400 text-[11px] font-semibold">
                    <th className="py-2.5 pl-1 pr-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedFileIds.length === filteredFiles.length &&
                          filteredFiles.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-[#0088cc] focus:ring-[#0088cc] cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 font-semibold">Name</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Size</th>
                    <th className="py-2.5 px-3 font-semibold">Uploaded</th>
                    <th className="py-2.5 pl-3 pr-1 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#111111]/60">
                  {filteredFiles.map((file, index) => {
                    const fileIdentifier =
                      file.id !== undefined ? file.id : `file-${index}`;
                    const fileIdStr = String(fileIdentifier);
                    const isSelected = selectedFileIds.includes(fileIdStr);
                    const isActionOpen = activeActionMenuId === fileIdentifier;

                    return (
                      <tr
                        key={fileIdentifier}
                        className={`group transition-colors ${
                          isSelected
                            ? "bg-sky-50/70 dark:bg-sky-950/40"
                            : "hover:bg-slate-50/80 dark:hover:bg-[#0a0a0a]/40"
                        }`}
                      >
                        <td className="py-3 pl-1 pr-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectFile(fileIdStr)}
                            className="rounded border-slate-300 text-[#0088cc] focus:ring-[#0088cc] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            {renderFileThumbnail(file)}
                            <div className="min-w-0 flex-1">
                              <span
                                onClick={() => onStreamFile(file)}
                                className={`font-bold truncate block cursor-pointer hover:text-[#0088cc] transition ${
                                  darkMode ? "text-white" : "text-slate-900"
                                }`}
                                title={file.file_name}
                              >
                                {file.file_name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {renderCategoryBadge(file.category)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {formatBytes(file.file_size)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {file.humanDate}
                        </td>
                        <td className="py-3 pl-3 pr-1 text-right relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId(
                                isActionOpen ? null : fileIdentifier,
                              );
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {isActionOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute right-0 top-8 z-30 w-44 rounded-2xl border p-1.5 space-y-1 ${
                                darkMode
                                  ? "bg-[#050505] border-white/10 text-slate-200"
                                  : "bg-white border-slate-200 text-slate-800"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  onStreamFile(file);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#0a0a0a] flex items-center space-x-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-500" />
                                <span>Preview / Stream</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  handleCopyLinkWithFeedback(file);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#0a0a0a] flex items-center space-x-2 cursor-pointer"
                              >
                                {copiedSlug ===
                                String(file.id || file.file_slug) ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span>Copy Direct Link</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  onDeleteFile(file);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete File</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-5">
          <div
            className={`p-6 rounded-3xl border transition-all duration-200 space-y-5 ${
              darkMode
                ? "bg-[#050505]/90 border-white/10"
                : "bg-white border-slate-100"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3
                className={`text-base font-black ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Recent Activity
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("analytics")}
                className="text-xs font-bold text-[#0088cc] hover:text-[#0077b5] flex items-center space-x-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#0a0a0a]">
              {/* Activity 1 */}
              <div className="relative flex items-start justify-between gap-3 text-xs">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-500">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <h4
                    className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Uploaded 12 files
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Today, 11:24 AM · 4.6 GB
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  Upload
                </span>
              </div>

              {/* Activity 2 */}
              <div className="relative flex items-start justify-between gap-3 text-xs">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-700 flex items-center justify-center text-[#0088cc]">
                  <Folder className="w-3 h-3" />
                </div>
                <div>
                  <h4
                    className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Created folder "Travel"
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Today, 10:01 AM
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-[#0088cc] border border-sky-200 dark:border-sky-800/50">
                  Folder
                </span>
              </div>

              {/* Activity 3 */}
              <div className="relative flex items-start justify-between gap-3 text-xs">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-700 flex items-center justify-center text-purple-500">
                  <Link2 className="w-3 h-3" />
                </div>
                <div>
                  <h4
                    className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Saved Telegram link
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Yesterday, 6:30 PM
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                  Link
                </span>
              </div>

              {/* Activity 4 */}
              <div className="relative flex items-start justify-between gap-3 text-xs">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-700 flex items-center justify-center text-cyan-500">
                  <RefreshCw className="w-3 h-3" />
                </div>
                <div>
                  <h4
                    className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Backup completed
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Yesterday, 2:18 PM · 2.8 GB
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/50">
                  Backup
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Remote URL Modal */}
      {remoteUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 ${
              darkMode
                ? "bg-[#050505] border-white/10 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm flex items-center space-x-2">
                <Link2 className="w-4 h-4 text-[#0088cc]" />
                <span>Upload via Remote URL</span>
              </h4>
              <button
                type="button"
                onClick={() => setRemoteUrlModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide a direct download link. Our MTProto backend will stream it
              directly into your Telegram workspace.
            </p>
            <input
              type="url"
              value={remoteUrlInput}
              onChange={(e) => setRemoteUrlInput(e.target.value)}
              placeholder="https://example.com/file.zip"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border ${
                darkMode
                  ? "bg-black border-white/10 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRemoteUrlModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (remoteUrlInput.trim()) {
                    setRemoteUrlModalOpen(false);
                    onNavigateTab("upload");
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0088cc] hover:bg-[#0077b5] transition "
              >
                Fetch & Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageOverviewDashboard;
