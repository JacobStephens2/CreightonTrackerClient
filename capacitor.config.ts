import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creighton.tracker',
  appName: 'Chart35',
  webDir: 'dist',
  server: {
    url: 'https://chart35.com',
    androidScheme: 'https',
  },
};

export default config;
