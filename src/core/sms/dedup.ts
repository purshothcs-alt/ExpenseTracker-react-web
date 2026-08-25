import db from '@core/database/db';
import type { PendingSmsTransaction } from '@core/database/types';
import type { SmsDirection } from './types';

export interface DedupInput {
  referenceId?: string;
  upiId?: string;
  smsSender: string;
  amount: number;
  direction: SmsDirection;
  accountLast4?: string;
  smsTimestamp: string;
}

/**
 * Computes a stable dedup key for an SMS transaction. A reference/UTR id is
 * globally unique per transaction, so it's preferred whenever present. When
 * no reference id was extracted, fall back to a composite of sender +
 * amount + direction + account + a minute-bucketed timestamp — good enough
 * to catch the double-delivery / re-import case without needing the raw
 * SMS body.
 */
export function computeSourceHash(input: DedupInput): string {
  if (input.referenceId) {
    return `ref:${input.referenceId.trim().toLowerCase()}`;
  }
  if (input.upiId) {
    // No ref id but a stable UPI VPA — still fairly unique combined with amount+minute.
    const minuteBucket = input.smsTimestamp.slice(0, 16);
    return `upi:${input.upiId.toLowerCase()}:${input.amount}:${minuteBucket}`;
  }
  const minuteBucket = input.smsTimestamp.slice(0, 16); // YYYY-MM-DDTHH:mm
  return `fb:${input.smsSender.toLowerCase()}:${input.amount}:${input.direction}:${
    input.accountLast4 ?? ''
  }:${minuteBucket}`;
}

/** Looks up an existing pending/approved/ignored SMS transaction with the same source hash. */
export async function findDuplicate(
  sourceHash: string,
): Promise<PendingSmsTransaction | undefined> {
  return db.pendingSmsTransactions.where('sourceHash').equals(sourceHash).first();
}
