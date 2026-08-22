import type { CapacitorConfig } from '@capacitor/cli';

// Bungkus WebView untuk build Android (debug/release). webDir menunjuk ke
// hasil `next build` dengan output: 'export' (folder out/).
const config: CapacitorConfig = {
  appId: 'id.tartib.app',
  appName: 'Tartib',
  webDir: 'out',
};

export default config;
