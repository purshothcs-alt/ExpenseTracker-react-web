import { describe, it, expect } from 'vitest';
import { computeSourceHash } from '@core/sms/dedup';

describe('computeSourceHash', () => {
  it('produces the same hash for the same reference id regardless of case/whitespace', () => {
    const a = computeSourceHash({
      referenceId: ' ABC123456 ',
      smsSender: 'HDFCBK',
      amount: 1000,
      direction: 'debit',
      smsTimestamp: '2026-08-25T10:00:00.000Z',
    });
    const b = computeSourceHash({
      referenceId: 'abc123456',
      smsSender: 'HDFCBK',
      amount: 1000,
      direction: 'debit',
      smsTimestamp: '2026-08-25T10:05:00.000Z', // even a different timestamp
    });
    expect(a).toBe(b);
  });

  it('produces different hashes for different reference ids', () => {
    const a = computeSourceHash({
      referenceId: 'ABC123456',
      smsSender: 'HDFCBK',
      amount: 1000,
      direction: 'debit',
      smsTimestamp: '2026-08-25T10:00:00.000Z',
    });
    const b = computeSourceHash({
      referenceId: 'XYZ999999',
      smsSender: 'HDFCBK',
      amount: 1000,
      direction: 'debit',
      smsTimestamp: '2026-08-25T10:00:00.000Z',
    });
    expect(a).not.toBe(b);
  });

  it('falls back to a composite key (sender+amount+direction+account+minute) when no reference id is present', () => {
    const a = computeSourceHash({
      smsSender: 'HDFCBK',
      amount: 500,
      direction: 'debit',
      accountLast4: '1234',
      smsTimestamp: '2026-08-25T10:00:00.000Z',
    });
    const b = computeSourceHash({
      smsSender: 'HDFCBK',
      amount: 500,
      direction: 'debit',
      accountLast4: '1234',
      smsTimestamp: '2026-08-25T10:00:45.000Z', // same minute
    });
    expect(a).toBe(b);
  });

  it('treats a different minute as a different transaction in the fallback path', () => {
    const a = computeSourceHash({
      smsSender: 'HDFCBK',
      amount: 500,
      direction: 'debit',
      accountLast4: '1234',
      smsTimestamp: '2026-08-25T10:00:00.000Z',
    });
    const b = computeSourceHash({
      smsSender: 'HDFCBK',
      amount: 500,
      direction: 'debit',
      accountLast4: '1234',
      smsTimestamp: '2026-08-25T10:05:00.000Z',
    });
    expect(a).not.toBe(b);
  });

  it('treats a different amount as a different transaction in the fallback path', () => {
    const a = computeSourceHash({
      smsSender: 'HDFCBK',
      amount: 500,
      direction: 'debit',
      accountLast4: '1234',
      smsTimestamp: '2026-08-25T10:00:00.000Z',
    });
    const b = computeSourceHash({
      smsSender: 'HDFCBK',
      amount: 600,
      direction: 'debit',
      accountLast4: '1234',
      smsTimestamp: '2026-08-25T10:00:00.000Z',
    });
    expect(a).not.toBe(b);
  });
});
