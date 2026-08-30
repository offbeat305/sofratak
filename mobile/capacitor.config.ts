import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Sofratak diner app — thin native wrapper around the live web storefront
 * (docs/mobile-app.md). Not a separate codebase: the app just opens the
 * production site in a native WebView, so every ordering feature ships
 * from the one Next.js app the moment it's live on the web. No offline
 * mode, no local business logic here on purpose.
 *
 * SOFRATAK_APP_URL lets `cap sync` point at a different environment
 * (e.g. a Vercel preview URL) without touching this file — defaults to
 * production.
 */
const APP_URL = process.env.SOFRATAK_APP_URL ?? 'https://www.sofratak.com';

const config: CapacitorConfig = {
  appId: 'com.sofratak.app',
  appName: 'Sofratak',
  webDir: 'www', // unused when server.url is set, but required by the CLI
  server: {
    url: APP_URL,
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
