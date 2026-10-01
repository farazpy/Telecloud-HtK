#!/usr/bin/env node
/**
 * TeleCloud - Automatic Binary Permission Restorer
 * Ensures executable permissions (0o755) on all node_modules binaries after npm install.
 */

import fs from 'fs';
import path from 'path';

if (process.platform !== 'win32') {
  const rootDir = process.cwd();
  const binDir = path.join(rootDir, 'node_modules', '.bin');

  let fixedCount = 0;

  // 1. Fix all symlinks/binaries in node_modules/.bin
  if (fs.existsSync(binDir)) {
    try {
      const files = fs.readdirSync(binDir);
      for (const file of files) {
        const filePath = path.join(binDir, file);
        try {
          fs.chmodSync(filePath, 0o755);
          fixedCount++;
        } catch {
          // Ignore individual permission warnings
        }
      }
    } catch (err) {
      console.warn('[Postinstall] Notice reading node_modules/.bin:', err.message);
    }
  }

  // 2. Fix critical binary paths specifically (tsx, vite, esbuild)
  const explicitBins = [
    path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.cjs'),
    path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js'),
    path.join(rootDir, 'node_modules', 'esbuild', 'bin', 'esbuild'),
    path.join(rootDir, 'server', 'telethon_service.py'),
    path.join(rootDir, 'scripts', 'deploy.sh'),
    path.join(rootDir, 'scripts', 'telethon_uploader.py')
  ];

  for (const binPath of explicitBins) {
    if (fs.existsSync(binPath)) {
      try {
        fs.chmodSync(binPath, 0o755);
        fixedCount++;
      } catch {
        // Ignore
      }
    }
  }

  // 3. Scan @esbuild architecture-specific native binaries if present
  const esbuildScopeDir = path.join(rootDir, 'node_modules', '@esbuild');
  if (fs.existsSync(esbuildScopeDir)) {
    try {
      const archDirs = fs.readdirSync(esbuildScopeDir);
      for (const arch of archDirs) {
        const nativeBin = path.join(esbuildScopeDir, arch, 'bin', 'esbuild');
        if (fs.existsSync(nativeBin)) {
          try {
            fs.chmodSync(nativeBin, 0o755);
            fixedCount++;
          } catch {}
        }
      }
    } catch {}
  }

  console.log(`[Postinstall] Verified & restored 755 execute permissions on ${fixedCount} binaries.`);
}
