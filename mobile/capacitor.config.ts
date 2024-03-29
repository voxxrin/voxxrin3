import { CapacitorConfig } from '@capacitor/cli';

const isDevMode = process.env.NODE_ENV === 'dev';

const config: CapacitorConfig = {
  appId: 'in.voxxr.mobile',
  appName: 'Voxxrin 3',
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
