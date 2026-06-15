import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.boxplayer.app',
  appName: 'BoxPlayer',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['file://*'],
  },
};

export default config;
