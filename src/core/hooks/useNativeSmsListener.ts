import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { drainNativeSmsQueue } from '@core/sms/nativeQueue';
import { useImportSmsTextMutation } from '@app/api/smsImportApi';

const POLL_INTERVAL_MS = 15_000;

/**
 * Bridges the native SMS queue (see SmsQueueStore.kt) into the same
 * importSmsText pipeline the Share Target and manual-paste flows use. A
 * complete no-op on the web build — Capacitor.isNativePlatform() is false
 * there, so this never touches the native plugin bridge (which wouldn't
 * exist anyway) and the Netlify/PWA deployment is unaffected.
 *
 * Drains on mount, whenever the app becomes visible again (covers resuming
 * from background, which is also when a cold-start/killed-app capture gets
 * picked up), and on a short interval while visible (covers an SMS arriving
 * while the app is already open in the foreground).
 */
export function useNativeSmsListener(): void {
  const [importSmsText] = useImportSmsTextMutation();
  const draining = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const drain = async () => {
      if (draining.current) return;
      draining.current = true;
      try {
        await drainNativeSmsQueue(importSmsText);
      } catch {
        // Native plugin unavailable or drain failed — nothing to surface here;
        // the next drain (on resume/poll) will pick the queue back up.
      } finally {
        draining.current = false;
      }
    };

    void drain();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void drain();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void drain();
    }, POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [importSmsText]);
}
