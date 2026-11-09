import React, { useState } from "react";
import {
  Terminal,
  Key,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code2,
  UploadCloud,
  FileText,
  Play,
  Layers,
  BarChart3,
  Film,
  Globe,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Zap,
  ChevronRight,
  Server,
  Lock,
  Search,
} from "lucide-react";

export interface ApiDocsPageProps {
  darkMode?: boolean;
  onNavigateHome: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  userApiKey?: string | null;
}

interface EndpointDoc {
  id: string;
  category: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  description: string;
  authRequired: boolean;
  contentType?: string;
  headers?: Array<{
    name: string;
    required: boolean;
    description: string;
    example: string;
  }>;
  queryParams?: Array<{
    name: string;
    required: boolean;
    description: string;
    example: string;
  }>;
  bodyParams?: Array<{
    name: string;
    required: boolean;
    description: string;
    example: string;
  }>;
  responses: Array<{
    status: number;
    title: string;
    description: string;
    json: string;
  }>;
}

export const ENDPOINTS_DATA: EndpointDoc[] = [
  {
    id: "verify-key",
    category: "Authentication",
    method: "GET",
    path: "/api/v1/verify",
    title: "Verify API Key Integrity",
    description:
      "Validates your API Key (starting with tc_...) and returns current user context, quota limits, and connected Telegram workspace details.",
    authRequired: true,
    headers: [
      {
        name: "X-API-Key",
        required: true,
        description: "Your TeleCloud API key",
        example: "tc_live_7f8a9b0c1d2e",
      },
      {
        name: "Authorization",
        required: false,
        description: "Alternative Bearer token header",
        example: "Bearer tc_live_7f8a9b0c1d2e",
      },
    ],
    responses: [
      {
        status: 200,
        title: "200 OK",
        description: "Key validated successfully",
        json: JSON.stringify(
          {
            success: true,
            valid: true,
            auth_method: "X-API-Key",
            user: {
              telegram_id: "123456789",
              first_name: "Alex",
              username: "alex_dev",
            },
            workspace_id: 1,
            workspace_name: "Primary Vault",
            message: "API key and workspace integrity verified successfully.",
          },
          null,
          2,
        ),
      },
      {
        status: 401,
        title: "401 Unauthorized",
        description: "Missing or invalid API key provided",
        json: JSON.stringify(
          { success: false, valid: false, error: "Invalid API key provided" },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "upload-file",
    category: "Files & Storage",
    method: "POST",
    path: "/api/v1/upload",
    title: "Upload File to Cloud Vault",
    description:
      "Streams binary file payload directly into your isolated Telegram storage channel attached to your workspace.",
    authRequired: true,
    contentType: "multipart/form-data",
    headers: [
      {
        name: "X-API-Key",
        required: true,
        description: "TeleCloud API key",
        example: "tc_live_7f8a9b0c1d2e",
      },
    ],
    bodyParams: [
      {
        name: "file",
        required: true,
        description: "Binary file payload (max 2 GB per file)",
        example: "(binary)",
      },
      {
        name: "storage_chat",
        required: false,
        description: 'Target storage channel ID or "me" (Saved Messages)',
        example: "me",
      },
      {
        name: "caption",
        required: false,
        description: "Optional metadata caption or search tags",
        example: "Release v2.4 build asset",
      },
    ],
    responses: [
      {
        status: 200,
        title: "200 OK",
        description: "File encrypted and stored in Telegram cloud",
        json: JSON.stringify(
          {
            success: true,
            file: {
              message_id: 1042,
              file_slug: "v24-build-asset-8f2a",
              file_name: "app-release-v2.4.zip",
              file_size: 48512940,
              mime_type: "application/zip",
              direct_link: "/f/v24-build-asset-8f2a/app-release-v2.4.zip",
              stream_link: "/stream/1042/app-release-v2.4.zip",
              created_at: "2026-11-06T10:20:00Z",
            },
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "list-files",
    category: "Files & Storage",
    method: "GET",
    path: "/api/v1/files",
    title: "List & Search Vault Files",
    description:
      "Queries files stored in your workspace with instant filtering by search keyword, MIME type, or workspace ID.",
    authRequired: true,
    headers: [
      {
        name: "X-API-Key",
        required: true,
        description: "TeleCloud API key",
        example: "tc_live_7f8a9b0c1d2e",
      },
    ],
    queryParams: [
      {
        name: "search",
        required: false,
        description: "Search keyword matching file title or caption",
        example: "release",
      },
      {
        name: "workspace_id",
        required: false,
        description: "Filter by specific workspace ID",
        example: "1",
      },
      {
        name: "mime_type",
        required: false,
        description: "Filter by MIME prefix (e.g. video, image, application)",
        example: "video",
      },
      {
        name: "limit",
        required: false,
        description: "Max items returned (default 50, max 200)",
        example: "50",
      },
    ],
    responses: [
      {
        status: 200,
        title: "200 OK",
        description: "List of storage files retrieved",
        json: JSON.stringify(
          {
            success: true,
            count: 2,
            files: [
              {
                message_id: 1042,
                file_slug: "v24-build-asset-8f2a",
                file_name: "app-release-v2.4.zip",
                file_size: 48512940,
                mime_type: "application/zip",
                direct_link: "/f/v24-build-asset-8f2a/app-release-v2.4.zip",
              },
              {
                message_id: 1041,
                file_slug: "hero-demo-video-9c1b",
                file_name: "hero-demo.mp4",
                file_size: 104857600,
                mime_type: "video/mp4",
                stream_link: "/stream/1041/hero-demo.mp4",
              },
            ],
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "delete-file",
    category: "Files & Storage",
    method: "DELETE",
    path: "/api/v1/files/:id",
    title: "Delete File from Vault",
    description:
      "Permanently purges the specified file record and issues a Telegram message deletion call.",
    authRequired: true,
    headers: [
      {
        name: "X-API-Key",
        required: true,
        description: "TeleCloud API key",
        example: "tc_live_7f8a9b0c1d2e",
      },
    ],
    responses: [
      {
        status: 200,
        title: "200 OK",
        description: "File deleted successfully",
        json: JSON.stringify(
          {
            success: true,
            message: "File deleted from storage vault successfully.",
          },
          null,
          2,
        ),
      },
      {
        status: 404,
        title: "404 Not Found",
        description: "File ID does not exist or belongs to another user",
        json: JSON.stringify(
          { success: false, error: "File not found" },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "direct-download",
    category: "Direct Download & CDN",
    method: "GET",
    path: "/f/:slug/:filename",
    title: "High-Speed Direct Link Access",
    description:
      "Public high-speed download link for stored files. Supports custom slug resolution and header disposition.",
    authRequired: false,
    responses: [
      {
        status: 200,
        title: "200 OK",
        description: "Binary stream payload with Content-Type header",
        json: "// Returns raw binary payload with Content-Disposition: attachment",
      },
    ],
  },
  {
    id: "video-stream",
    category: "Direct Download & CDN",
    method: "GET",
    path: "/stream/:message_id",
    title: "Byte-Range Video & Audio CDN",
    description:
      "High-performance media streaming endpoint supporting standard Range headers (HTTP 206 Partial Content) for smooth scrubbing in HTML5 video players.",
    authRequired: false,
    headers: [
      {
        name: "Range",
        required: false,
        description: "HTTP Byte Range header for partial streaming",
        example: "bytes=0-1048575",
      },
    ],
    responses: [
      {
        status: 206,
        title: "206 Partial Content",
        description: "Media byte chunk delivered with Content-Range header",
        json: "// Stream chunk payload (Content-Range: bytes 0-1048575/104857600)",
      },
    ],
  },
  {
    id: "list-workspaces",
    category: "Workspaces",
    method: "GET",
    path: "/api/v1/workspaces",
    title: "List Storage Workspaces",
    description:
      "Retrieves all isolated storage workspaces associated with your TeleCloud account.",
    authRequired: true,
    headers: [
      {
        name: "X-API-Key",
        required: true,
        description: "TeleCloud API key",
        example: "tc_live_7f8a9b0c1d2e",
      },
    ],
    responses: [
      {
        status: 200,
        title: "200 OK",
        description: "Workspaces retrieved",
        json: JSON.stringify(
          {
            success: true,
            workspaces: [
              {
                id: 1,
                name: "Primary Vault",
                storage_chat: "me",
                file_count: 124,
                created_at: "2026-01-15",
              },
              {
                id: 2,
                name: "4K Renders",
                storage_chat: "-100192837465",
                file_count: 38,
                created_at: "2026-03-20",
              },
            ],
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "get-stats",
    category: "Analytics & Metrics",
    method: "GET",
    path: "/api/v1/stats",
    title: "Storage & Bandwidth Metrics",
    description:
      "Returns real-time analytics including total bytes stored, file breakdown by category, and bandwidth telemetry.",
    authRequired: true,
    headers: [
      {
        name: "X-API-Key",
        required: true,
        description: "TeleCloud API key",
        example: "tc_live_7f8a9b0c1d2e",
      },
    ],
    responses: [
      {
        status: 200,
        title: "200 OK",
        description: "Account statistics retrieved",
        json: JSON.stringify(
          {
            success: true,
            stats: {
              totalFiles: 162,
              totalBytes: 154927420180,
              formattedBytes: "144.28 GB",
              breakdown: {
                video: { count: 42, bytes: 120400000000 },
                image: { count: 80, bytes: 15400000000 },
                document: { count: 40, bytes: 19127420180 },
              },
            },
          },
          null,
          2,
        ),
      },
    ],
  },
];

export const ApiDocsPage: React.FC<ApiDocsPageProps> = ({
  darkMode = true,
  onNavigateHome,
  onOpenAuth,
  userApiKey,
}) => {
  const [selectedEndpointId, setSelectedEndpointId] =
    useState<string>("verify-key");
  const [codeLanguage, setCodeLanguage] = useState<
    "curl" | "python" | "js" | "node" | "go" | "rust"
  >("curl");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState<boolean>(false);

  // Theme Constants
  const pageBg = darkMode
    ? "bg-black text-slate-100"
    : "bg-[#f0f6ff] text-slate-900";
  const headerBg = darkMode
    ? "bg-black/90 border-[#111111] text-white"
    : "bg-white/90 border-slate-200 text-slate-900";
  const cardBg = darkMode
    ? "bg-[#050505] border-[#111111]"
    : "bg-white border-slate-200";
  const subCardBg = darkMode
    ? "bg-[#0a0a0a] border-[#222222]"
    : "bg-slate-50 border-slate-200";
  const codeBg = darkMode
    ? "bg-black border-[#111111]"
    : "bg-slate-900 border-slate-800";
  const textColor = darkMode ? "text-slate-300" : "text-slate-600";
  const headingColor = darkMode ? "text-white" : "text-slate-900";

  // Custom key input field for live code generation
  const activeKey = userApiKey || "tc_live_7f8a9b0c1d2e";

  const selectedEndpoint =
    ENDPOINTS_DATA.find((e) => e.id === selectedEndpointId) ||
    ENDPOINTS_DATA[0];

  const getBaseOrigin = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://telecloud.app";
  };

  const currentBaseUrl = getBaseOrigin();

  // Generate Code Snippets dynamically
  const generateSnippet = (endpoint: EndpointDoc, lang: string): string => {
    const fullUrl = `${currentBaseUrl}${endpoint.path.replace(":id", "1042").replace(":slug", "sample-slug").replace(":filename", "video.mp4")}`;

    switch (lang) {
      case "curl": {
        let cmd = `curl -X ${endpoint.method} "${fullUrl}"`;
        if (endpoint.authRequired) {
          cmd += ` \\\n  -H "X-API-Key: ${activeKey}"`;
        }
        if (endpoint.contentType === "multipart/form-data") {
          cmd += ` \\\n  -F "file=@/path/to/local/file.zip"`;
          cmd += ` \\\n  -F "storage_chat=me"`;
        }
        return cmd;
      }
      case "python": {
        if (endpoint.contentType === "multipart/form-data") {
          return `import requests

url = "${fullUrl}"
headers = {
    "X-API-Key": "${activeKey}"
}
files = {
    "file": open("file.zip", "rb")
}
data = {
    "storage_chat": "me"
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.status_code)
print(response.json())`;
        }
        return `import requests

url = "${fullUrl}"
headers = {
    "X-API-Key": "${activeKey}"
}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)
print(response.json())`;
      }
      case "js": {
        return `const response = await fetch("${fullUrl}", {
  method: "${endpoint.method}",
  headers: {
    "X-API-Key": "${activeKey}"
  }
});

const data = await response.json();
console.log(data);`;
      }
      case "node": {
        return `const axios = require('axios');

async function executeCall() {
  try {
    const response = await axios({
      method: '${endpoint.method.toLowerCase()}',
      url: '${fullUrl}',
      headers: {
        'X-API-Key': '${activeKey}'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}

executeCall();`;
      }
      case "go": {
        return `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	client := &http.Client{}
	req, err := http.NewRequest("${endpoint.method}", "${fullUrl}", nil)
	if err != nil {
		panic(err)
	}

	req.Header.Add("X-API-Key", "${activeKey}")

	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`;
      }
      case "rust": {
        return `use reqwest::header::HeaderMap;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let res = client
        .${endpoint.method.toLowerCase()}("${fullUrl}")
        .header("X-API-Key", "${activeKey}")
        .send()
        .await?;

    let text = res.text().await?;
    println!("{}", text);
    Ok(())
}`;
      }
      default:
        return "";
    }
  };

  // Exporter Functions
  const handleDownloadPostman = () => {
    const postmanJson = {
      info: {
        name: "TeleCloud REST API v2.2",
        _postman_id: "telecloud-api-collection-v2",
        description:
          "Official Postman Collection for TeleCloud REST API Engine.",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [
        { key: "baseUrl", value: currentBaseUrl, type: "string" },
        { key: "apiKey", value: activeKey, type: "string" },
      ],
      item: ENDPOINTS_DATA.map((ep) => ({
        name: ep.title,
        request: {
          method: ep.method,
          header: ep.authRequired
            ? [{ key: "X-API-Key", value: "{{apiKey}}", type: "text" }]
            : [],
          url: {
            raw: `{{baseUrl}}${ep.path}`,
            host: ["{{baseUrl}}"],
            path: ep.path.split("/").filter(Boolean),
          },
        },
      })),
    };

    const blob = new Blob([JSON.stringify(postmanJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TeleCloud_REST_API.postman_collection.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOpenAPI = () => {
    const openApiJson = {
      openapi: "3.0.3",
      info: {
        title: "TeleCloud REST API Engine",
        version: "2.2.22",
        description:
          "High-speed cloud storage engine powered by Telegram MTProto.",
      },
      servers: [{ url: currentBaseUrl }],
      paths: ENDPOINTS_DATA.reduce((acc: any, ep) => {
        if (!acc[ep.path]) acc[ep.path] = {};
        acc[ep.path][ep.method.toLowerCase()] = {
          summary: ep.title,
          description: ep.description,
          responses: {
            "200": { description: "Successful response" },
          },
        };
        return acc;
      }, {}),
    };

    const blob = new Blob([JSON.stringify(openApiJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TeleCloud_OpenAPI_v3.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText(`${currentBaseUrl}/api/v1`);
    setCopiedBaseUrl(true);
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#0088cc] selection:text-white transition-colors duration-200 ${pageBg}`}
    >
      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-2xl border-b px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-200 ${headerBg}`}
      >
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={onNavigateHome}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#38bdf8] flex items-center justify-center text-white">
            <svg
              className="w-5 h-5 fill-current transform -rotate-12 translate-x-0.2"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`font-black text-base tracking-tight ${headingColor}`}
              >
                TeleCloud
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20`}
              >
                REST API v2.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Developer Integration & OpenAPI Documentation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateHome}
            className={`px-3.5 py-1.5 rounded-xl border transition cursor-pointer font-bold text-xs ${
              darkMode
                ? "border-[#222222] bg-[#0a0a0a] hover:bg-[#111111] text-slate-300"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            ← Back to App
          </button>
          <button
            onClick={() => onOpenAuth("login")}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Sign In / Get API Key
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div
          className={`p-8 sm:p-10 rounded-3xl border relative overflow-hidden space-y-6 transition-colors duration-200 ${
            darkMode
              ? "bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-black border-[#111111]"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#0088cc]/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#0088cc]/15 text-[#38bdf8] border border-[#0088cc]/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> REST Engine v2.2.26
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Isolated Telegram
              Vaults
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Range Video Streaming
            </span>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1
              className={`text-3xl sm:text-4xl font-black tracking-tight ${headingColor}`}
            >
              Integrate TeleCloud Unlimited Storage into Your Applications
            </h1>
            <p className={`text-sm sm:text-base leading-relaxed ${textColor}`}>
              Programmatically upload, search, stream, and manage files stored
              securely in your personal Telegram cloud engine. Full support for
              custom HTTP authentication headers, byte-range video scrubbing,
              and multi-workspace isolation.
            </p>
          </div>

          {/* Quick Action Exporters */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleDownloadPostman}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center space-x-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Download Postman Collection (.json)</span>
            </button>

            <button
              onClick={handleDownloadOpenAPI}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center space-x-2 cursor-pointer active:scale-98"
            >
              <Code2 className="w-4 h-4" />
              <span>Download OpenAPI v3 Spec</span>
            </button>

            <button
              onClick={handleCopyBaseUrl}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition flex items-center space-x-2 cursor-pointer active:scale-98 ${
                darkMode
                  ? "bg-[#0a0a0a] hover:bg-[#111111] border-[#222222] text-slate-300"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              {copiedBaseUrl ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>
                {copiedBaseUrl ? "Copied Base URL!" : "Copy API Base URL"}
              </span>
            </button>
          </div>
        </div>

        {/* Workspace Documentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Endpoint Catalog Navigation */}
          <div className="lg:col-span-4 space-y-4">
            <div
              className={`p-4 rounded-2xl border space-y-3 sticky top-24 transition-colors duration-200 ${cardBg}`}
            >
              <div
                className={`flex items-center justify-between pb-2 border-b ${darkMode ? "border-[#111111]" : "border-slate-100"}`}
              >
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#0088cc]" /> Endpoint
                  Catalog
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    darkMode
                      ? "bg-[#0a0a0a] border-[#222222] text-slate-400"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
                >
                  {ENDPOINTS_DATA.length} Endpoints
                </span>
              </div>

              {/* Grouped Catalog */}
              {Array.from(new Set(ENDPOINTS_DATA.map((e) => e.category))).map(
                (cat) => (
                  <div key={cat} className="space-y-1 pt-1">
                    <p className="text-[11px] font-mono font-extrabold text-slate-500 uppercase px-2">
                      {cat}
                    </p>
                    <div className="space-y-1">
                      {ENDPOINTS_DATA.filter((e) => e.category === cat).map(
                        (ep) => {
                          const isSelected = ep.id === selectedEndpointId;
                          return (
                            <button
                              key={ep.id}
                              onClick={() => setSelectedEndpointId(ep.id)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-[#0088cc]/15 text-[#38bdf8] border border-[#0088cc]/30"
                                  : `bg-transparent ${darkMode ? "text-slate-400 hover:bg-[#0a0a0a] hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span
                                  className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                                    ep.method === "GET"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : ep.method === "POST"
                                        ? "bg-sky-500/20 text-sky-400"
                                        : ep.method === "DELETE"
                                          ? "bg-rose-500/20 text-rose-400"
                                          : "bg-amber-500/20 text-amber-400"
                                  }`}
                                >
                                  {ep.method}
                                </span>
                                <span className="truncate">{ep.title}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Right Endpoint Detail & Live Code Interactive Console */}
          <div className="lg:col-span-8 space-y-6">
            {/* Endpoint Detail Card */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors duration-200 ${cardBg}`}
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b pb-5 transition-colors ${darkMode ? "border-[#111111]" : "border-slate-100"}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg ${
                        selectedEndpoint.method === "GET"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : selectedEndpoint.method === "POST"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : selectedEndpoint.method === "DELETE"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {selectedEndpoint.method}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-700"}`}
                    >
                      {selectedEndpoint.path}
                    </span>
                  </div>
                  <h2 className={`text-xl font-extrabold ${headingColor}`}>
                    {selectedEndpoint.title}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedEndpoint.authRequired ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> API Key Required
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Public Endpoint
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-sm leading-relaxed ${textColor}`}>
                {selectedEndpoint.description}
              </p>

              {/* Request Parameters Section */}
              {selectedEndpoint.headers &&
                selectedEndpoint.headers.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Request Headers
                    </h4>
                    <div
                      className={`rounded-2xl border overflow-hidden transition-colors ${darkMode ? "border-[#111111] bg-black" : "border-slate-200 bg-white"}`}
                    >
                      <table className="w-full text-left text-xs">
                        <thead
                          className={`text-slate-400 border-b transition-colors ${darkMode ? "bg-[#0a0a0a] border-[#111111]" : "bg-slate-50 border-slate-200"}`}
                        >
                          <tr>
                            <th className="p-3 font-mono">Header Name</th>
                            <th className="p-3 font-mono">Type</th>
                            <th className="p-3 font-mono">Description</th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y font-mono transition-colors ${darkMode ? "divide-[#111111] text-slate-300" : "divide-slate-200 text-slate-700"}`}
                        >
                          {selectedEndpoint.headers.map((h, i) => (
                            <tr
                              key={i}
                              className={
                                darkMode
                                  ? "hover:bg-[#0a0a0a]/50"
                                  : "hover:bg-slate-50"
                              }
                            >
                              <td className="p-3 text-[#38bdf8] font-bold">
                                {h.name}
                              </td>
                              <td className="p-3 text-slate-500">
                                {h.required ? "Required" : "Optional"}
                              </td>
                              <td className="p-3 text-slate-400">
                                {h.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {selectedEndpoint.bodyParams &&
                selectedEndpoint.bodyParams.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Multipart Form-Data Fields
                    </h4>
                    <div
                      className={`rounded-2xl border overflow-hidden transition-colors ${darkMode ? "border-[#111111] bg-black" : "border-slate-200 bg-white"}`}
                    >
                      <table className="w-full text-left text-xs">
                        <thead
                          className={`text-slate-400 border-b transition-colors ${darkMode ? "bg-[#0a0a0a] border-[#111111]" : "bg-slate-50 border-slate-200"}`}
                        >
                          <tr>
                            <th className="p-3 font-mono">Field</th>
                            <th className="p-3 font-mono">Required</th>
                            <th className="p-3 font-mono">Description</th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y font-mono transition-colors ${darkMode ? "divide-[#111111] text-slate-300" : "divide-slate-200 text-slate-700"}`}
                        >
                          {selectedEndpoint.bodyParams.map((b, i) => (
                            <tr
                              key={i}
                              className={
                                darkMode
                                  ? "hover:bg-[#0a0a0a]/50"
                                  : "hover:bg-slate-50"
                              }
                            >
                              <td className="p-3 text-emerald-400 font-bold">
                                {b.name}
                              </td>
                              <td className="p-3 text-slate-500">
                                {b.required ? "Yes" : "No"}
                              </td>
                              <td className="p-3 text-slate-400">
                                {b.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Code Generator & Snippet Box */}
              <div
                className={`space-y-3 pt-4 border-t transition-colors ${darkMode ? "border-[#111111]" : "border-slate-100"}`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#0088cc]" /> Live Code
                    Generator
                  </h4>

                  {/* Language Selector */}
                  <div
                    className={`flex items-center space-x-1 p-1 rounded-xl border transition-colors ${subCardBg}`}
                  >
                    {(
                      ["curl", "python", "js", "node", "go", "rust"] as const
                    ).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                          codeLanguage === lang
                            ? "bg-[#0088cc] text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Window */}
                <div
                  className={`relative rounded-2xl border p-4 font-mono text-xs text-sky-300 space-y-2 overflow-x-auto ${codeBg}`}
                >
                  <div
                    className={`flex items-center justify-between pb-2 border-b text-[10px] ${darkMode ? "border-[#111111] text-slate-500" : "border-slate-700 text-slate-400"}`}
                  >
                    <span>{codeLanguage.toUpperCase()} SNIPPET</span>
                    <button
                      onClick={() =>
                        handleCopySnippet(
                          generateSnippet(selectedEndpoint, codeLanguage),
                        )
                      }
                      className="flex items-center space-x-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode ? "Copied" : "Copy Snippet"}</span>
                    </button>
                  </div>

                  <pre className="text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {generateSnippet(selectedEndpoint, codeLanguage)}
                  </pre>
                </div>
              </div>

              {/* Expected Response Payload */}
              <div
                className={`space-y-3 pt-4 border-t transition-colors ${darkMode ? "border-[#111111]" : "border-slate-100"}`}
              >
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Response Schema
                </h4>

                {selectedEndpoint.responses.map((resp, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 space-y-2 transition-colors ${darkMode ? "border-[#111111] bg-black" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-emerald-400">
                        {resp.title}
                      </span>
                      <span className="text-slate-500">{resp.description}</span>
                    </div>
                    <pre
                      className={`text-[11px] font-mono leading-relaxed overflow-x-auto p-3 rounded-xl border transition-colors ${
                        darkMode
                          ? "text-slate-300 bg-[#050505] border-[#111111]"
                          : "text-slate-700 bg-slate-50 border-slate-100"
                      }`}
                    >
                      {resp.json}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
