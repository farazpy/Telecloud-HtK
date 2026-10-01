#!/usr/bin/env bash
# ==============================================================================
# TeleCloud - Automated aaPanel Production Deployment Script
# Target Host: aaPanel Node.js Manager (telecloudworker)
# Repo: farazpy/Telecloud-HtK (branch: main)
# Target Path: /www/wwwroot/telecloud-worker
# ==============================================================================

set -euo pipefail

# Log formatters
log_info()  { echo -e "\033[1;34m[INFO]\033[0m  $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_ok()    { echo -e "\033[1;32m[OK]\033[0m    $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_warn()  { echo -e "\033[1;33m[WARN]\033[0m  $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_err()   { echo -e "\033[1;31m[ERROR]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $*" >&2; }

# Application & aaPanel Paths
APP_DIR="${APP_DIR:-/www/wwwroot/telecloud-worker}"
AAPANEL_PROJECT="telecloudworker"
AAPANEL_SCRIPT="/www/server/nodejs/vhost/scripts/${AAPANEL_PROJECT}.sh"
AAPANEL_PID_FILE="/www/server/nodejs/vhost/pids/${AAPANEL_PROJECT}.pid"
NODE_BIN_DIR="/www/server/nodejs/v24.18.0/bin"

# 1. Environment & PATH setup
log_info "Starting automated deployment for [${AAPANEL_PROJECT}]..."

if [ -d "${NODE_BIN_DIR}" ]; then
  export PATH="${NODE_BIN_DIR}:${PATH}"
  log_info "Using aaPanel Node.js path: ${NODE_BIN_DIR}"
fi

# If APP_DIR doesn't match and current directory has package.json, fallback to PWD
if [ ! -d "${APP_DIR}" ] && [ -f "./package.json" ]; then
  APP_DIR="$(pwd)"
  log_warn "Target directory /www/wwwroot/telecloud-worker not found; using current directory: ${APP_DIR}"
fi

cd "${APP_DIR}" || {
  log_err "Failed to enter application directory: ${APP_DIR}"
  exit 1
}

# 2. Preserve & Guard Production .env
ENV_BACKUP=""
if [ -f ".env" ]; then
  log_info "Guarding existing production .env file (preservation lock)..."
  ENV_BACKUP="$(mktemp /tmp/telecloud_env_backup.XXXXXX)"
  cp -p ".env" "${ENV_BACKUP}"
else
  log_warn "No existing .env file detected in ${APP_DIR}."
fi

# 3. Fetch latest main branch from GitHub
log_info "Fetching latest updates from origin/main..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch origin main || {
    log_err "git fetch failed. Please check network connectivity and repository access."
    if [ -n "${ENV_BACKUP}" ] && [ -f "${ENV_BACKUP}" ]; then rm -f "${ENV_BACKUP}"; fi
    exit 1
  }

  log_info "Syncing working tree to origin/main..."
  git reset --hard origin/main || {
    log_err "git reset --hard origin/main failed."
    if [ -n "${ENV_BACKUP}" ] && [ -f "${ENV_BACKUP}" ]; then rm -f "${ENV_BACKUP}"; fi
    exit 1
  }
else
  log_warn "Current directory is not a git repository clone; skipping git sync."
fi

# 4. Restore preserved production .env
if [ -n "${ENV_BACKUP}" ] && [ -f "${ENV_BACKUP}" ]; then
  cp -p "${ENV_BACKUP}" ".env"
  chmod 600 ".env"
  rm -f "${ENV_BACKUP}"
  log_ok "Production .env verified and securely preserved."
fi

# 5. Install Dependencies
log_info "Installing npm dependencies..."
npm install --no-audit --no-fund || {
  log_err "npm install failed."
  exit 1
}
log_ok "Dependencies installed successfully."

# 6. Explicitly enforce sensible 755 executable permissions
log_info "Enforcing 755 executable permissions on binaries..."
if [ -d "node_modules/.bin" ]; then
  find node_modules/.bin -type f -exec chmod 755 {} + || true
  find node_modules/.bin -type l -exec chmod 755 {} + || true
fi

# Specific critical binaries
[ -f "node_modules/tsx/dist/cli.mjs" ] && chmod 755 node_modules/tsx/dist/cli.mjs || true
[ -f "node_modules/vite/bin/vite.js" ] && chmod 755 node_modules/vite/bin/vite.js || true
[ -f "node_modules/esbuild/bin/esbuild" ] && chmod 755 node_modules/esbuild/bin/esbuild || true

# Native architecture esbuild binaries
if [ -d "node_modules/@esbuild" ]; then
  find node_modules/@esbuild -name "esbuild" -exec chmod 755 {} + || true
fi

# Scripts and python daemon
[ -f "scripts/deploy.sh" ] && chmod 755 scripts/deploy.sh || true
[ -f "scripts/postinstall.js" ] && chmod 755 scripts/postinstall.js || true
[ -f "server/telethon_service.py" ] && chmod 755 server/telethon_service.py || true
log_ok "Executable permissions (755) applied cleanly."

# 7. Build production assets
log_info "Building production frontend (npm run build)..."
npm run build || {
  log_err "npm run build failed."
  exit 1
}
log_ok "Frontend build complete."

# 8. Restart aaPanel Node.js Project
log_info "Restarting aaPanel Node.js project [${AAPANEL_PROJECT}]..."
RESTART_SUCCESS=0

if [ -f "${AAPANEL_SCRIPT}" ]; then
  log_info "Found aaPanel management script: ${AAPANEL_SCRIPT}"
  bash "${AAPANEL_SCRIPT}" restart || {
    log_warn "Direct restart returned non-zero, trying stop then start..."
    bash "${AAPANEL_SCRIPT}" stop || true
    sleep 2
    bash "${AAPANEL_SCRIPT}" start || {
      log_err "Failed to start ${AAPANEL_PROJECT} via ${AAPANEL_SCRIPT}."
      exit 1
    }
  }
  RESTART_SUCCESS=1
else
  log_warn "aaPanel script not found at ${AAPANEL_SCRIPT}."
  # If running in environment without aaPanel script, check if PID file exists
  if [ -f "${AAPANEL_PID_FILE}" ]; then
    OLD_PID="$(cat "${AAPANEL_PID_FILE}" 2>/dev/null || true)"
    if [ -n "${OLD_PID}" ] && kill -0 "${OLD_PID}" 2>/dev/null; then
      log_info "Stopping existing process (PID ${OLD_PID})..."
      kill "${OLD_PID}" || true
      sleep 2
    fi
  fi
  log_info "Skipping aaPanel specific restart as script is not present on this host."
fi

# 9. Verification phase
log_info "Verifying application status..."
if [ "${RESTART_SUCCESS}" -eq 1 ]; then
  VERIFIED=0
  for i in $(seq 1 10); do
    sleep 1
    if [ -f "${AAPANEL_PID_FILE}" ]; then
      CURRENT_PID="$(cat "${AAPANEL_PID_FILE}" 2>/dev/null || true)"
      if [ -n "${CURRENT_PID}" ] && kill -0 "${CURRENT_PID}" 2>/dev/null; then
        log_ok "aaPanel project [${AAPANEL_PROJECT}] is running under PID: ${CURRENT_PID}"
        VERIFIED=1
        break
      fi
    fi
  done

  if [ "${VERIFIED}" -eq 0 ]; then
    log_err "Application failed to report an active PID within 10 seconds."
    exit 1
  fi
fi

log_ok "================================================================="
log_ok "Deployment completed successfully for ${AAPANEL_PROJECT}!"
log_ok "================================================================="
exit 0
