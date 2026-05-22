import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creighton.tracker',
  appName: 'Creighton Cycle Tracker',
  webDir: 'dist',
  server: {
    url: 'https://creightontracker.com',
    androidScheme: 'https',
  },
};

export default config;
