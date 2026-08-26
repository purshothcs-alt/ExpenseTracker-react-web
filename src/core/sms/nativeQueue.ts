import { Capacitor } from '@capacitor/core';
import { SmsImport } from '@core/native/smsImportPlugin';

type ImportSmsText = (arg: {
  sender: string;
  body: string;
  timestamp: string;
}) => Promise<unknown>;

/**
 * Drains everything the native SmsReceiver has queued since the last drain
 * and feeds each message through the same importSmsText pipeline the Share
 * Target and manual-paste flows use. Shared by the automatic poller
 * (useNativeSmsListener) and the manual "Check now" button so both go
 * through one code path. Returns the number of messages drained.
 */
export async function drainNativeSmsQueue(importSmsText: ImportSmsText): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  const { messages } = await SmsImport.drainQueue();
  for (const message of messages) {
    await importSmsText({
      sender: message.sender,
      body: message.body,
      timestamp: new Date(message.timestampMillis).toISOString(),
    });
  }
  return messages.length;
}
