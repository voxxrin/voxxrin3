import { CapacitorConfig } from '@capacitor/cli';

const isDevMode = process.env.NODE_ENV === 'dev';

const config: CapacitorConfig = {
  appId: 'com.voxxrin3.mobile',
  appName: 'voxxrin',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  },
  android: {
    allowMixedContent: isDevMode
  },
  ios: {
    preferredContentMode: "mobile"
  },
  server: {
    cleartext: true,
    allowNavigation: [
      "localhost",
      ...(isDevMode?['0.0.0.0']:[])
    ]
  }
};

export default config;
