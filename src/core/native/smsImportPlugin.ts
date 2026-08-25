import { registerPlugin } from '@capacitor/core';

export interface NativeSmsMessage {
  sender: string;
  body: string;
  timestampMillis: number;
}

export interface SmsImportPluginApi {
  /** Returns and clears everything the native SMS receiver has captured since the last drain. */
  drainQueue(): Promise<{ messages: NativeSmsMessage[] }>;
  /** Capacitor's standard permission-state shape, keyed by the "sms" alias declared in the native plugin. */
  checkPermissions(): Promise<{ sms: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' }>;
  requestPermissions(): Promise<{ sms: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' }>;
}

/**
 * JS-side handle for the native SmsImportPlugin (android/app/src/main/java/com/expensetracker/pro/SmsImportPlugin.kt).
 * Safe to import from web-only code paths too — registerPlugin() only ever
 * talks to a native bridge when one exists; on a plain browser deployment
 * (e.g. the Netlify build) every call below simply rejects, which is why
 * every caller must check Capacitor.isNativePlatform() first (see
 * useNativeSmsListener.ts).
 */
export const SmsImport = registerPlugin<SmsImportPluginApi>('SmsImport');
