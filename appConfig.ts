/**
 * TeleCloud Centralized Application Configuration
 *
 * This is the SINGLE authoritative configuration file for the entire application.
 * All database credentials, Telegram MTProto API keys, admin PINs, server URLs,
 * ports, and API keys are stored here.
 */

export interface AppConfig {
  // Server & Network Configuration
  server: {
    // Port to run the server on for VPS / custom deployments
    port: number;
    // Primary application URL
    appUrl: string;
    // Custom domain
    customDomain: string;
    // Disable Vite HMR file watching if true
    disableHmr: boolean;
    // Node environment mode ('production' | 'development')
    nodeEnv: string;
  };

  // MySQL Relational Database Credentials
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };

  // Telegram MTProto API Credentials (from https://my.telegram.org)
  telegram: {
    apiId: number;
    apiHash: string;
  };

  // Security & Admin Authentication
  security: {
    // Master Admin Dashboard Access PIN
    adminPin: string;
    // App Lock PIN
    appLockPin: string;
  };

  // Google Gemini API Configuration
  gemini: {
    apiKey: string;
  };
}

export const appConfig: AppConfig = {
  server: {
    port: 3001,
    appUrl: 'https://s3.htknetwork.in',
    customDomain: 's3.htknetwork.in',
    disableHmr: false,
    nodeEnv: 'production',
  },

  database: {
    host: '13.140.210.131',
    port: 3306,
    user: 'htks3',
    password: 'Afrin#9492',
    name: 'htks3',
  },

  telegram: {
    apiId: 27254692,
    apiHash: '9f6f826a62b78378292fd224e943cb65',
  },

  security: {
    adminPin: '9292',
    appLockPin: '9292',
  },

  gemini: {
    apiKey: 'MY_GEMINI_API_KEY',
  },
};

export default appConfig;
