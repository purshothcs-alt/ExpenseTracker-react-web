import type { BankParseResult, SmsDirection } from './types';

/** Common shape every downstream stage (dedup, matchers, pipeline) works with. */
export interface NormalizedSmsTransaction {
  bankKey: string;
  direction: SmsDirection;
  amount: number;
  accountLast4?: string;
  merchant?: string;
  upiId?: string;
  referenceId?: string;
  baseConfidence: number;
  smsSender: string;
  smsTimestamp: string;
}

function cleanMerchant(merchant: string | undefined): string | undefined {
  if (!merchant) return undefined;
  const cleaned = merchant.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function toIsoTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

/** Normalizes a raw parser result + SMS envelope into a consistent shape for the rest of the pipeline. */
export function normalizeSmsTransaction(
  parsed: BankParseResult,
  envelope: { sender: string; timestamp: Date | string },
): NormalizedSmsTransaction {
  return {
    bankKey: parsed.bankKey,
    direction: parsed.direction,
    amount: Math.round(parsed.amount * 100) / 100,
    accountLast4: parsed.accountLast4,
    merchant: cleanMerchant(parsed.merchant),
    upiId: parsed.upiId?.toLowerCase(),
    referenceId: parsed.referenceId?.trim(),
    baseConfidence: parsed.baseConfidence,
    smsSender: envelope.sender.trim(),
    smsTimestamp: toIsoTimestamp(envelope.timestamp),
  };
}
