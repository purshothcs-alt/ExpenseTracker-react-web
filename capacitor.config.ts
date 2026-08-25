import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expensetracker.pro',
  appName: 'Expense Tracker Pro',
  webDir: 'dist',
  android: {
    // The web build already targets modern browsers; Capacitor just needs a
    // WebView shell around it plus the native SMS plugin (see android/app/src/main/java/.../SmsImportPlugin.kt).
    allowMixedContent: false,
  },
};

export default config;
