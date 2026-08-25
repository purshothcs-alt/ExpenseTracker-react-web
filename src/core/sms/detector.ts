/**
 * Transaction SMS Detector
 * -------------------------------------------------------------------------
 * First stage of the SMS import pipeline (see pipeline.ts). Decides whether
 * an incoming SMS is even worth parsing as a bank/UPI transaction, before
 * any bank-specific parsing runs. Keeping this separate from the parsers
 * means OTP/promo/balance-only messages never reach the (heavier) parser
 * registry and can never end up in the review queue.
 */

const OTP_PATTERNS = [
  /\botp\b/i,
  /one[-\s]?time password/i,
  /verification code/i,
  /security code/i,
  /do not share (?:this|your) otp/i,
];

const PROMO_PATTERNS = [
  /\b(offer|sale|discount|cashback\s*upto|win\b|prize|congratulations|voucher|coupon)\b/i,
  /\bT&C\s*apply\b/i,
  /\bunsubscribe\b/i,
  /\blimited period\b/i,
  /\bapply now\b/i,
  /\bpre-?approved\b/i,
];

const LOGIN_ALERT_PATTERNS = [
  /\blogged?[-\s]?in\b/i,
  /\bnew device\b/i,
  /\bpassword (?:changed|reset)\b/i,
  /\blogin attempt\b/i,
];

/** Balance-only statements that mention a figure but no movement of money. */
const BALANCE_ONLY_PATTERNS = [
  /\bavailable balance\b/i,
  /\bcurrent balance\b/i,
  /\bmin(?:imum)? balance\b/i,
];

const TRANSACTION_KEYWORDS = [
  /\bdebited\b/i,
  /\bcredited\b/i,
  /\bdebit\b/i,
  /\bcredit\b/i,
  /\bspent\b/i,
  /\bpaid\b/i,
  /\breceived\b/i,
  /\bwithdrawn\b/i,
  /\btransferred\b/i,
  /\bpurchase of\b/i,
  /\bdeposited\b/i,
];

const AMOUNT_PATTERN = /(?:inr|rs\.?|₹)\s?[\d,]+(?:\.\d{1,2})?/i;

export interface SmsDetectionResult {
  isTransactional: boolean;
  reason: string;
}

/**
 * Heuristic pass/fail check. Deliberately conservative: an SMS must contain
 * both a monetary amount AND an explicit movement verb (debited/credited/...)
 * and must not match a known non-transactional pattern.
 */
export function detectTransactionSms(sender: string, body: string): SmsDetectionResult {
  const text = body.trim();
  if (!text) return { isTransactional: false, reason: 'empty-message' };

  if (OTP_PATTERNS.some((p) => p.test(text))) {
    return { isTransactional: false, reason: 'otp-message' };
  }

  if (LOGIN_ALERT_PATTERNS.some((p) => p.test(text))) {
    return { isTransactional: false, reason: 'login-security-alert' };
  }

  const hasAmount = AMOUNT_PATTERN.test(text);
  const hasTxnKeyword = TRANSACTION_KEYWORDS.some((p) => p.test(text));

  // Promotional messages sometimes mention "cashback" together with an amount;
  // only reject on promo patterns if there's no explicit debit/credit verb.
  if (!hasTxnKeyword && PROMO_PATTERNS.some((p) => p.test(text))) {
    return { isTransactional: false, reason: 'promotional-message' };
  }

  if (!hasTxnKeyword && BALANCE_ONLY_PATTERNS.some((p) => p.test(text))) {
    return { isTransactional: false, reason: 'balance-only-message' };
  }

  if (!hasAmount) {
    return { isTransactional: false, reason: 'no-amount-found' };
  }

  if (!hasTxnKeyword) {
    return { isTransactional: false, reason: 'no-transaction-verb' };
  }

  void sender; // sender is not currently used for detection, reserved for future allow/deny lists
  return { isTransactional: true, reason: 'matched-transaction-pattern' };
}
