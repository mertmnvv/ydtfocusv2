import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ydtfocus.app',
  appName: 'YDT Focus',
  webDir: 'out',
  server: {
    url: 'https://www.ydtfocus.xyz',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  }
};

export default config;
