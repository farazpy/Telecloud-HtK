import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import appConfig from './appConfig.ts';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // Allow s3.htknetwork.in and related domains
      allowedHosts: [
        's3.htknetwork.in',
        '.htknetwork.in',
        '.run.app',
      ],
      // HMR configuration controlled via appConfig
      hmr: !appConfig.server.disableHmr,
      watch: appConfig.server.disableHmr ? null : {},
    },
  };
});
