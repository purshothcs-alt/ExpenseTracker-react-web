import { describe, it, expect } from 'vitest';
import {
  computeConfidenceScore,
  AUTO_APPROVE_THRESHOLD,
  LOW_CONFIDENCE_THRESHOLD,
} from '@core/sms/confidence';

describe('computeConfidenceScore', () => {
  it('returns just the base confidence when nothing else corroborates', () => {
    const score = computeConfidenceScore({
      baseConfidence: 50,
      hasReferenceId: false,
      accountMatched: false,
      hasMerchant: false,
      categoryMatched: false,
    });
    expect(score).toBe(50);
  });

  it('adds boosts for each piece of corroborating evidence', () => {
    const score = computeConfidenceScore({
      baseConfidence: 70,
      hasReferenceId: true,
      accountMatched: true,
      hasMerchant: true,
      categoryMatched: true,
    });
    expect(score).toBe(98); // 70 + 10 + 8 + 5 + 5
  });

  it('caps the score at 100', () => {
    const score = computeConfidenceScore({
      baseConfidence: 90,
      hasReferenceId: true,
      accountMatched: true,
      hasMerchant: true,
      categoryMatched: true,
    });
    expect(score).toBe(100);
  });

  it('a fully-corroborated bank-header match clears the auto-approve threshold', () => {
    const score = computeConfidenceScore({
      baseConfidence: 80,
      hasReferenceId: true,
      accountMatched: true,
      hasMerchant: false,
      categoryMatched: false,
    });
    expect(score).toBeGreaterThanOrEqual(AUTO_APPROVE_THRESHOLD);
  });

  it('an unrecognized-sender match with nothing else stays below the low-confidence threshold', () => {
    const score = computeConfidenceScore({
      baseConfidence: 50,
      hasReferenceId: false,
      accountMatched: false,
      hasMerchant: false,
      categoryMatched: false,
    });
    expect(score).toBeLessThan(LOW_CONFIDENCE_THRESHOLD);
  });
});
