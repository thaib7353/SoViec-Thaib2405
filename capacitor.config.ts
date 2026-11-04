import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soviec.app',
  appName: 'Sổ Việc',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_soviec',
      iconColor: '#2563EB',
    },
  },
};

export default config;
