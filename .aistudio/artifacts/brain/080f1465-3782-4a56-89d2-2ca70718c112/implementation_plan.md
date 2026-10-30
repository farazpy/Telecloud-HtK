# Multi-User SaaS Telegram Cloud Storage Platform Implementation Plan

Transform the single-account Telegram cloud storage application into a production-grade multi-user SAAS platform where users create personal web accounts, connect their individual Telegram accounts via live phone + OTP verification, and manage file storage across Saved Messages or custom Telegram Channels.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed based on user responses:

- **Confirmed Decision 1 (Telegram Account Linking)**: Live Phone Number entry + Telegram OTP Verification Code flow rendered directly in the Web UI.
- **Confirmed Decision 2 (Web Dashboard Authentication)**: Standard User Registration and Login with Username and Password with JWT/session token authentication.
- **Confirmed Decision 3 (File Storage Target)**: Users can toggle their active storage destination between "Saved Messages" (Me) and a "Custom Telegram Channel" (with channel fetch & selection).
- **App Lock & File Serving**: App lock PIN protection safeguards administrative/dashboard entry without interrupting public file serving/streaming endpoints.
- **Database & Data Compatibility**: Database schema updates strictly append new multi-user tables (`users`, `user_telegram_sessions`, `user_storage_configs`, `user_files`) without dropping or altering pre-existing columns or tables.
- **Header Version Tracking**: Frontend header displays a bumped version indicator on every modification pass.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the application from a personal single-account storage proxy into an isolated multi-tenant cloud storage platform. Users register an account, log into their dashboard, link their Telegram account using their phone number and Telegram OTP, choose their preferred Telegram storage location, and upload, stream, search, and share files.
- **Target Audience / Persona**: Individual users, creators, and teams seeking unlimited, secure, self-managed cloud storage backed by Telegram's infrastructure.
- **Key Value**: Unlimited cloud storage per user, zero shared-account privacy leakage, full isolation of personal files, and smooth web interface for file previewing, video streaming, and link sharing.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **User Sign Up & Login**: Clean, secure authentication page where users register or sign in with username and password.
  2. **Telegram Auth Modal / Stepper**:
     - *Step 1*: Enter Phone Number (with country code selector/formatting).
     - *Step 2*: Receive OTP code on Telegram app -> Enter OTP code (and 2FA password if enabled on Telegram account).
     - *Step 3*: Verification complete; user session string securely encrypted and linked to user account.
  3. **Storage Target Toggle & Settings**:
     - Toggle between "Saved Messages" and "Custom Telegram Channel".
     - For channels: auto-fetch channels where the user is admin/owner, allow selecting a channel or creating/entering a channel ID.
  4. **Multi-User Dashboard & File Explorer**:
     - Grid / List view of files stored in the user's connected Telegram storage.
     - Upload drag-and-drop zone with real-time chunked upload progress bar.
     - In-browser media preview (images, audio, video streaming with range headers, PDFs, code).
     - Public share link generator for individual files.
  5. **Header & Profile Bar**:
     - Modern top navigation showing connected Telegram user profile (avatar, phone, storage status), storage mode switcher, version badge (incremented on each update), and sign-out button.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Professional, slate-toned SaaS storage dashboard (inspired by Linear and Vercel dark/light modes).
  - *Color Palette*: Slate dark canvas (`#0F172A`), structural surfaces (`#1E293B`), sharp energetic blue accent (`#2563EB` / `#3B82F6`), clean muted typography (`#94A3B8`).
  - *Typography*: Clean sans display (`Plus Jakarta Sans` / `Outfit`) for headers, crisp body font (`DM Sans` / `Public Sans`), tabular figures (`tabular-nums font-mono`) for file sizes, timestamps, and transfer rates.
  - *Component Styling*: Flat single-elevation cards with hairline borders (`1px solid rgba(255,255,255,0.08)`), crisp zero-pill metadata tags separated by `·`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: GramJS Client Pool per User Session vs Centralized Bot**
  - *Chosen Approach*: Maintain dynamic user client instances in backend memory initialized with encrypted GramJS `StringSession` strings per authenticated web user.
  - *Why*: Allows true user-level Telegram storage (Saved Messages & private channels owned by that specific user) without requiring bot token administration or file size limitations imposed on standard bots.
  - *Alternatives Considered*: Standard Telegram Bot API (limited file sizes, cannot write to user's personal Saved Messages).

- **Decision 2: Storage Configuration Isolation**
  - *Chosen Approach*: Store per-user storage preference (`storage_type`: `'saved_messages'` | `'channel'`, `channel_id`: string) in DB. All file uploads, list requests, and stream requests read the requesting user's active session and target peer.
  - *Why*: Guarantees zero cross-contamination between users and ensures uploads land strictly in the target designated by the user.

- **Decision 3: Uninterrupted Public File Proxy**
  - *Chosen Approach*: Shared file links use public access tokens linked to user file records so public downloads/streaming work without requiring the viewing user to log into the dashboard or bypass the Dashboard App Lock PIN.
  - *Why*: Satisfies the explicit constraint: "important dont stop file serving, just block access to web gui dashboard".

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Web Client (React / Vite)                       │
│  ┌───────────────────────┐  ┌────────────────────────┐  ┌─────────────────┐ │
│  │ User Auth (Login/Reg) │  │ Telegram Connect Modal │  │ Dashboard View  │ │
│  └───────────┬───────────┘  └───────────┬────────────┘  └────────┬────────┘ │
└──────────────┼──────────────────────────┼────────────────────────┼──────────┘
               │                          │                        │
               ▼                          ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Backend Server (Express / Node)                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Auth Middleware (JWT / App Lock PIN Validation)                       │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌────────────────────────┐ ┌───────┴────────────────┐ ┌──────────────────┐ │
│  │ Multi-User Manager     │ │ GramJS Session Pool    │ │ File Streamer    │ │
│  │ (Register / Pass Hash) │ │ (User Telegram Client) │ │ (Range Requests) │ │
│  └───────────┬────────────┘ └───────┬────────────────┘ └────────┬─────────┘ │
└──────────────┼──────────────────────┼───────────────────────────┼───────────┘
               │                      │                           │
               ▼                      ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────────────────────────┐
│ Database (SQLite/MySQL)   │ │ Telegram MTProto Servers                      │
│ - users                   │ │ - Saved Messages (Me)                         │
│ - user_telegram_sessions  │ │ - Private Custom Channels                     │
│ - user_storage_configs    │ └───────────────────────────────────────────────┘
│ - user_files              │
└───────────────────────────┘
```

### Data Schema (Additive & Backward-Compatible)

1. **`users`**: `id`, `username`, `password_hash`, `created_at`
2. **`user_telegram_sessions`**: `id`, `user_id`, `phone_number`, `session_string_encrypted`, `dc_id`, `updated_at`
3. **`user_storage_configs`**: `id`, `user_id`, `target_type` ('saved_messages' | 'channel'), `target_channel_id`, `target_channel_title`, `updated_at`
4. **`user_files`**: `id`, `user_id`, `telegram_message_id`, `file_name`, `file_size`, `mime_type`, `public_token`, `created_at`

### API Endpoint Mapping

- `POST /api/auth/register` - Create web user account
- `POST /api/auth/login` - User login & JWT issuance
- `GET /api/auth/me` - Fetch user profile & Telegram connection status
- `POST /api/auth/verify-pin` - App Lock PIN verification
- `POST /api/telegram/send-code` - Send OTP code to phone number via GramJS
- `POST /api/telegram/verify-code` - Submit OTP code (and 2FA password) to authenticate GramJS session
- `POST /api/telegram/disconnect` - Clear active GramJS session for user
- `GET /api/telegram/channels` - Fetch list of user's Telegram channels
- `POST /api/telegram/storage-config` - Set target storage destination (Saved Messages or selected Channel)
- `GET /api/files` - List files in user's active Telegram storage
- `POST /api/files/upload` - Chunked upload file to user's Telegram storage target
- `GET /api/files/stream/:fileId` - Stream / download file with HTTP Range support
- `DELETE /api/files/:fileId` - Delete file from Telegram storage

---

## 5. Execution Steps

1. **Database Schema Setup**: Verify DB connection and apply additive tables (`users`, `user_telegram_sessions`, `user_storage_configs`, `user_files`).
2. **Authentication & Session Engine**: Implement JWT-based user auth, password hashing, and session management alongside dashboard PIN validation.
3. **GramJS User Client Pool Service**: Implement multi-tenant GramJS manager supporting phone code request, OTP sign-in, 2FA password completion, session string encryption/decryption, channel listing, and message upload/download.
4. **Storage & File APIs**: Build file list, chunked upload, streaming proxy, and deletion endpoints connected to each user's active GramJS client and target channel/peer.
5. **Frontend Multi-User Interface**:
   - Register / Login page.
   - Header with bumped version number, user profile badge, storage indicator, and App Lock PIN gate.
   - Telegram Account Connection Modal (Phone -> OTP Code -> Success).
   - Storage Destination Toggle (Saved Messages vs Channel picker).
   - Dynamic File Manager with Drag-and-Drop, Preview Modal, and Share Links.
6. **Verification**: Compile with `compile_applet`, test full workflow, and verify build integrity.
