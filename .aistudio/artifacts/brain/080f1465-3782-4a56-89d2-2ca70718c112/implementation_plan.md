# API Expansion & Public Interactive API Documentation with Postman Export

Expand the TeleCloud REST API engine to support complete REST CRUD operations across files, workspaces, stats, streaming, and direct link generation. Build a dedicated, public-facing **API Documentation & Integration Hub** (`/docs` and `/api-docs`) accessible directly from the guest landing page navigation bar and footer.

## User Review & Critical Decisions

> [!IMPORTANT]
> The public API documentation page will be accessible without requiring user authentication so external developers and public visitors can inspect TeleCloud's architecture, test live code snippets, and export Postman collections before signing up.

- **Confirmed Decision 1**: **Public Access & Navigation**: Added "API Docs" to the main guest header navigation bar and footer under the "Developers" column, linking directly to `/docs`.
- **Confirmed Decision 2**: **Postman & Developer Exports**: Included 1-click **Download Postman Collection (v2.1 JSON)**, **Download OpenAPI v3.0 Specification (JSON)**, **Open in Postman Web**, and live multi-language code generators (cURL, Python Requests, JavaScript Fetch, Node.js Axios, Go, Rust).
- **Confirmed Decision 3**: **Full REST API Endpoint Suite**: Documented and exposed all TeleCloud backend capability endpoints:
  1. `POST /api/v1/upload` (File Upload with Telegram Storage Channel routing)
  2. `GET /api/v1/files` (List & Search Storage Vault Files with pagination)
  3. `GET /api/v1/files/:id` (Retrieve Metadata & Storage Specs)
  4. `DELETE /api/v1/files/:id` (Remove File & Delete Telegram Message)
  5. `GET /f/:slug/:filename` & `/api/download/:id/:name` (Direct High-Speed Download)
  6. `GET /api/stream/:id` (Byte-Range Video & Audio Streaming CDN)
  7. `GET /api/v1/workspaces` & `POST /api/v1/workspaces` (Multi-Workspace Vault Management)
  8. `GET /api/v1/stats` (Storage Usage, File Counts, and Bandwidth Metrics)
  9. `POST /api/v1/api-key/regenerate` (API Key Lifecycle Management)

---

## 1. Overview & Core Concept

- **What It Does**: TeleCloud exposes its underlying high-capacity Telegram-backed cloud engine to developers via standard HTTP headers (`X-API-Key: tc_...` or `Authorization: Bearer tc_...`). The new **Public API Documentation Page** acts as an interactive developer hub featuring live request builders, copyable code blocks, endpoint response schemas, and download options for Postman and OpenAPI specs.
- **Target Audience**: Developers, DevOps engineers, content creators, and automation tool builders looking to store, stream, or manage files programmatically via TeleCloud.
- **Key Value**: Enables frictionless integration of TeleCloud's storage engine into third-party apps, scripts, CLI tools, and web services.

---

## 2. User Experience & Visual Design

- **Guest Landing Site Integration**:
  - **Top Navigation Bar**: Added "API Docs" link alongside Features, Benefits, Streaming, Security, and Pricing.
  - **Footer Navigation**: Added "API Reference", "Postman Collection", and "OpenAPI Spec" links in the Developers section.
- **API Documentation Layout (`/docs` Page)**:
  - **Hero Header**: High-impact title *"TeleCloud REST API & Developer Hub"*, subtitle, API Key status indicator, and prominent action buttons: **Download Postman Collection**, **Download OpenAPI v3 Spec**, and **Copy Base URL**.
  - **Interactive Endpoint Sidebar**: Sticky left navigation categorizing endpoints into *Authentication*, *Files & Storage*, *Video Streaming & CDN*, *Workspaces*, and *Analytics & Metrics*.
  - **Interactive Code Generator**: Right panel with language tabs (`cURL`, `Python`, `JavaScript`, `Node.js Axios`, `Go`, `Rust`) dynamically updating based on selected endpoint, path parameters, and query parameters.
  - **Response Schema & Status Codes**: Highlighting `200 OK`, `206 Partial Content`, `401 Unauthorized`, `404 Not Found`, and `413 File Too Large` with JSON example payloads.
  - **AMOLED Dark Mode**: Styled with pure black backgrounds (`#000000`), deep card surfaces (`#050505`, `#0a0a0a`), subtle gray borders (`#111111`), and sky-blue (`#0088cc`/`#38bdf8`) accents.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Postman & OpenAPI Specification Generators**:
  - *Chosen Approach*: Dynamic client-side and server-side generators that construct valid Postman v2.1 Collection JSON and OpenAPI 3.0.3 specification JSON on demand.
  - *Why*: Allows instant import into Postman Desktop/Web, Insomnia, Swagger UI, or automated code generators without hardcoded static files that become outdated.
- **Decision 2: Universal API Key Authentication**:
  - *Chosen Approach*: Support both `X-API-Key` custom header and standard `Authorization: Bearer <api_key>` header format.
  - *Why*: Provides maximum compatibility across different HTTP client libraries and third-party frameworks.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Public Guest Landing Site                        │
│   Navbar ["API Docs"] ───────────────► Public API Page (/docs)           │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      Public API Documentation Component                  │
│                                                                          │
│  ┌────────────────────────┐ ┌──────────────────────┐ ┌────────────────┐  │
│  │ Interactive Endpoint   │ │  Live Code Generator │ │ Postman &      │  │
│  │ Catalog & Schemas      │ │  (cURL/Python/JS/Go) │ │ OpenAPI Exporter│  │
│  └────────────────────────┘ └──────────────────────┘ └────────────────┘  │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼ HTTP Requests with X-API-Key / Bearer
┌──────────────────────────────────────────────────────────────────────────┐
│                     TeleCloud Node.js Backend Engine                     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Express Router / API Middleware (apiKeyAuth, RateLimit)            │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                    │                                     │
│     ┌──────────────────────────────┼─────────────────────────────┐       │
│     ▼                              ▼                             ▼       │
│  ┌────────────────────┐   ┌─────────────────┐   ┌─────────────────────┐  │
│  │ /api/v1/files      │   │ /api/stream/:id │   │ /api/v1/workspaces  │  │
│  │ /api/v1/upload     │   │ /f/:slug/:name  │   │ /api/v1/stats       │  │
│  └─────────┬──────────┘   └────────┬────────┘   └──────────┬──────────┘  │
└────────────┼───────────────────────┼───────────────────────┼─────────────┘
             │                       │                       │
             ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        Telegram MTProto Storage Engine                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Planned File Changes

1. **`src/pages/ApiDocsPage.tsx`** *(New File)*:
   - Full interactive API documentation page with Postman v2.1 collection export, OpenAPI v3 spec generator, live code generators (cURL, Python, JS, Node, Go, Rust), schema previews, and copy-to-clipboard functionality.
2. **`src/App.tsx`**:
   - Add `/docs` and `/api-docs` routes to `currentRoute` state router.
   - Update guest navbar and footer to include the "API Docs" link.
   - Integrate `ApiDocsPage` into public landing views.
   - Increment `APP_VERSION` to `v2.2.22`.
3. **`server.ts`**:
   - Ensure all public REST API endpoints (`/api/v1/files`, `/api/v1/upload`, `/api/v1/workspaces`, `/api/v1/stats`, `/api/v1/openapi.json`, `/api/v1/postman.json`) are registered and properly exposed.
