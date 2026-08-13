import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.sigeapp.pravoce',
  appName: 'SigeApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
