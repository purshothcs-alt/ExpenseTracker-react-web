/**
 * Shared regex-based field extractors used by every bank/UPI parser.
 * Individual bank parsers (see ./sbi.ts, ./hdfc.ts, etc.) are thin wrappers
 * that pick which sender headers they own and tune the base confidence
 * score — the actual field extraction lives here so it isn't duplicated
 * ten times over for messages that are, in practice, very similar.
 */
import type { SmsDirection } from '../types';

const AMOUNT_RE = /(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;

// Matches "A/c XX1234", "a/c no XXXXXX1234", "A/C *1234", "card ending 1234", "XX1234" style masks.
// The a/c-prefixed alternative accepts a single mask char (some banks, e.g.
// HDFC's UPI "Sent" template, use just one "*") since the a/c keyword
// context already makes a false match very unlikely.
const LAST4_RE =
  /(?:a\/?c|acct|account|card)[a-z\s.]{0,20}?(?:no\.?|number)?[a-z\s.]{0,10}?[x*]{1,}(\d{4})\b|\b[x*]{2,}(\d{4})\b|\bending\s+(\d{4})\b/i;

const REF_RE =
  /(?:ref(?:erence)?(?:\s*no\.?|\s*id)?|txn\s*id|utr(?:\s*no)?|upi\s*ref(?:\s*no)?)[:\s#-]*([A-Za-z0-9]{6,25})/i;

const UPI_ID_RE = /\b([a-zA-Z0-9.\-_]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,64})\b/;

const CREDIT_KEYWORDS = /\b(credited|received|deposited)\b/i;
// "sent" covers HDFC's UPI debit template ("Sent Rs.X From A/c ... To ...").
const DEBIT_KEYWORDS = /\b(debited|debit|spent|paid|withdrawn|purchase of|sent)\b/i;

// Text that follows these connectors is usually the merchant/payee.
const MERCHANT_AFTER_RE =
  /\b(?:to|at|towards|for)\s+([A-Za-z0-9&.'\- ]{2,40}?)(?:\s+on\b|\s+ref\b|\s+txn\b|\s+dt\b|[.,]|$)/i;
const MERCHANT_FROM_RE =
  /\bfrom\s+([A-Za-z0-9&.'\- ]{2,40}?)(?:\s+on\b|\s+ref\b|\s+txn\b|\s+dt\b|[.,]|$)/i;

export function extractAmount(text: string): number | undefined {
  const m = text.match(AMOUNT_RE);
  if (!m) return undefined;
  const value = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function extractAccountLast4(text: string): string | undefined {
  const m = text.match(LAST4_RE);
  if (!m) return undefined;
  return m[1] || m[2] || m[3] || undefined;
}

export function extractReferenceId(text: string): string | undefined {
  const m = text.match(REF_RE);
  return m ? m[1] : undefined;
}

export function extractUpiId(text: string): string | undefined {
  const m = text.match(UPI_ID_RE);
  return m ? m[1] : undefined;
}

export function extractDirection(text: string): SmsDirection | undefined {
  const isCredit = CREDIT_KEYWORDS.test(text);
  const isDebit = DEBIT_KEYWORDS.test(text);
  if (isCredit && !isDebit) return 'credit';
  if (isDebit && !isCredit) return 'debit';
  return undefined; // ambiguous — caller should treat as low-confidence / needs review
}

export function extractMerchant(
  text: string,
  direction: SmsDirection | undefined,
): string | undefined {
  const pattern = direction === 'credit' ? MERCHANT_FROM_RE : MERCHANT_AFTER_RE;
  const m = text.match(pattern);
  if (!m) return undefined;
  const merchant = m[1].trim();
  // Reject obvious non-merchant captures (account/masked-number fragments).
  if (/^[x*\d\s]+$/i.test(merchant)) return undefined;
  return merchant;
}

export interface CommonParseResult {
  direction?: SmsDirection;
  amount?: number;
  accountLast4?: string;
  referenceId?: string;
  upiId?: string;
  merchant?: string;
}

/** Runs every shared extractor over the SMS body in one pass. */
export function parseCommonFields(body: string): CommonParseResult {
  const direction = extractDirection(body);
  return {
    direction,
    amount: extractAmount(body),
    accountLast4: extractAccountLast4(body),
    referenceId: extractReferenceId(body),
    upiId: extractUpiId(body),
    merchant: extractMerchant(body, direction),
  };
}
