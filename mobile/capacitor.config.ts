import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.voxxrin3.mobile",
  appName: "voxxrin",
  bundledWebRuntime: false,
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
