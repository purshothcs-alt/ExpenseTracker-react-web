/**
 * Confidence scoring — combines the parser's base confidence with boosts
 * for each piece of corroborating evidence found. Used purely to decide
 * whether auto-approval (if enabled) may act on a transaction; every
 * detected transaction lands in the review queue regardless of score
 * (see pipeline.ts) so a low score never means "silently dropped".
 */
export interface ConfidenceInputs {
  baseConfidence: number;
  hasReferenceId: boolean;
  accountMatched: boolean;
  hasMerchant: boolean;
  categoryMatched: boolean;
}

/** Auto-approval (when enabled in settings) only ever fires at or above this score. */
export const AUTO_APPROVE_THRESHOLD = 85;

/** Below this score the transaction is flagged for extra scrutiny in the review UI. */
export const LOW_CONFIDENCE_THRESHOLD = 60;

export function computeConfidenceScore(inputs: ConfidenceInputs): number {
  let score = inputs.baseConfidence;
  if (inputs.hasReferenceId) score += 10;
  if (inputs.accountMatched) score += 8;
  if (inputs.hasMerchant) score += 5;
  if (inputs.categoryMatched) score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}
