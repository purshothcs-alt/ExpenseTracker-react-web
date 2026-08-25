import { describe, it, expect } from 'vitest';
import { detectTransactionSms } from '@core/sms/detector';

describe('detectTransactionSms', () => {
  it('accepts a standard debit SMS', () => {
    const result = detectTransactionSms(
      'HDFCBK',
      'Rs 2,499.00 debited from a/c XX5678 on 24-08-26 to SWIGGY. UPI Ref 123456789012.',
    );
    expect(result.isTransactional).toBe(true);
  });

  it('accepts a standard credit SMS', () => {
    const result = detectTransactionSms(
      'ICICIB',
      'INR 799.00 credited to your A/c XX9876 on 25-Aug-26 from VPA friend@okicici. Ref 998877665544',
    );
    expect(result.isTransactional).toBe(true);
  });

  it('rejects an OTP message even from a bank sender', () => {
    const result = detectTransactionSms(
      'HDFCBK',
      '123456 is your OTP for login. Do not share this OTP with anyone. -HDFC Bank',
    );
    expect(result.isTransactional).toBe(false);
    expect(result.reason).toBe('otp-message');
  });

  it('rejects a promotional message', () => {
    const result = detectTransactionSms(
      'PAYTM',
      'Get 50% cashback on your next purchase! Use code SAVE50. T&C apply.',
    );
    expect(result.isTransactional).toBe(false);
    expect(result.reason).toBe('promotional-message');
  });

  it('rejects a balance-only statement', () => {
    const result = detectTransactionSms(
      'SBIINB',
      'Your available balance in A/c XX1234 is Rs 15,000.00 as on 25-08-26',
    );
    expect(result.isTransactional).toBe(false);
    expect(result.reason).toBe('balance-only-message');
  });

  it('rejects a login/security alert', () => {
    const result = detectTransactionSms(
      'HDFCBK',
      'New device login detected for your HDFC NetBanking account. If this was not you, contact us immediately.',
    );
    expect(result.isTransactional).toBe(false);
    expect(result.reason).toBe('login-security-alert');
  });

  it('rejects a message with no amount', () => {
    const result = detectTransactionSms(
      'SBIINB',
      'Your A/c XX1234 was debited. Contact branch for details.',
    );
    expect(result.isTransactional).toBe(false);
    expect(result.reason).toBe('no-amount-found');
  });

  it('rejects a message with an amount but no transaction verb', () => {
    const result = detectTransactionSms(
      'SBIINB',
      'Rs 500 is the minimum balance required for A/c XX1234.',
    );
    expect(result.isTransactional).toBe(false);
  });

  it('rejects an empty message', () => {
    const result = detectTransactionSms('SBIINB', '   ');
    expect(result.isTransactional).toBe(false);
    expect(result.reason).toBe('empty-message');
  });
});
