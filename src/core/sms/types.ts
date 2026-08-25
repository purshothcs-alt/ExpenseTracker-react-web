/**
 * SMS parsers only ever detect a movement of money in or out of an account —
 * never a transfer (a transfer between the user's own accounts isn't
 * something a single bank SMS can express). Narrower than the database's
 * TransactionDirection so the pipeline can't accidentally produce one.
 */
export type SmsDirection = 'debit' | 'credit';

/** Result of a single bank/UPI parser successfully reading an SMS body. */
export interface BankParseResult {
  bankKey: string;
  direction: SmsDirection;
  amount: number;
  accountLast4?: string;
  merchant?: string;
  upiId?: string;
  referenceId?: string;
  /** Base confidence (0-100) this parser assigns before dedup/account/category boosts. */
  baseConfidence: number;
}

/**
 * One entry in the bank/UPI parser registry. Adding support for a new bank
 * or payment app means adding one object here — never touching the shared
 * extractors or the pipeline.
 */
export interface BankParser {
  key: string;
  name: string;
  /** True if this parser owns SMS from the given sender header (e.g. "HDFCBK", "VM-SBIINB"). */
  matchesSender: (sender: string) => boolean;
  /** Returns null if the body doesn't contain enough to build a transaction (missing amount/direction). */
  parse: (body: string) => BankParseResult | null;
}
