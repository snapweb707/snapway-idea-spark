import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c8f35e7411f04437ba73f33ec9b723e9',
  appName: 'snapway-idea-spark',
  webDir: 'dist',
  server: {
    url: 'https://c8f35e74-11f0-4437-ba73-f33ec9b723e9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;