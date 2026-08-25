import { describe, it, expect } from 'vitest';
import { normalizeSmsTransaction } from '@core/sms/normalizer';
import type { BankParseResult } from '@core/sms/types';

const baseParsed: BankParseResult = {
  bankKey: 'HDFC',
  direction: 'debit',
  amount: 1299.999,
  accountLast4: '1234',
  merchant: '  AMAZON   ',
  upiId: 'Merchant@YBL',
  referenceId: '  412233445566  ',
  baseConfidence: 80,
};

describe('normalizeSmsTransaction', () => {
  it('rounds the amount to 2 decimal places', () => {
    const result = normalizeSmsTransaction(baseParsed, {
      sender: 'HDFCBK',
      timestamp: '2026-08-25T10:32:00.000Z',
    });
    expect(result.amount).toBe(1300);
  });

  it('collapses whitespace in the merchant name', () => {
    const result = normalizeSmsTransaction(baseParsed, {
      sender: 'HDFCBK',
      timestamp: '2026-08-25T10:32:00.000Z',
    });
    expect(result.merchant).toBe('AMAZON');
  });

  it('lower-cases the UPI id', () => {
    const result = normalizeSmsTransaction(baseParsed, {
      sender: 'HDFCBK',
      timestamp: '2026-08-25T10:32:00.000Z',
    });
    expect(result.upiId).toBe('merchant@ybl');
  });

  it('trims the reference id', () => {
    const result = normalizeSmsTransaction(baseParsed, {
      sender: 'HDFCBK',
      timestamp: '2026-08-25T10:32:00.000Z',
    });
    expect(result.referenceId).toBe('412233445566');
  });

  it('converts the timestamp to a valid ISO string', () => {
    const result = normalizeSmsTransaction(baseParsed, {
      sender: 'HDFCBK',
      timestamp: '2026-08-25T10:32:00.000Z',
    });
    expect(result.smsTimestamp).toBe('2026-08-25T10:32:00.000Z');
  });

  it('falls back to now for an unparseable timestamp', () => {
    const result = normalizeSmsTransaction(baseParsed, {
      sender: 'HDFCBK',
      timestamp: 'not-a-date',
    });
    expect(Number.isNaN(new Date(result.smsTimestamp).getTime())).toBe(false);
  });

  it('leaves an undefined merchant as undefined rather than an empty string', () => {
    const result = normalizeSmsTransaction(
      { ...baseParsed, merchant: undefined },
      { sender: 'HDFCBK', timestamp: '2026-08-25T10:32:00.000Z' },
    );
    expect(result.merchant).toBeUndefined();
  });
});
