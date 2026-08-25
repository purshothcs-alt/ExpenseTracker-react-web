import { describe, it, expect } from 'vitest';
import { parseWithRegistry } from '@core/sms/parsers/registry';

describe('parseWithRegistry — bank-specific formats (fictional sample data)', () => {
  it('parses an SBI debit SMS', () => {
    const result = parseWithRegistry(
      'SBIINB',
      'Dear Customer, Rs.1,500.00 debited from A/c XX1234 on 25-08-26 to AMAZON. Ref No 412233445566. -SBI',
    );
    expect(result).not.toBeNull();
    expect(result?.bankKey).toBe('SBI');
    expect(result?.direction).toBe('debit');
    expect(result?.amount).toBe(1500);
    expect(result?.accountLast4).toBe('1234');
    expect(result?.referenceId).toBe('412233445566');
    expect(result?.merchant).toMatch(/amazon/i);
  });

  it('parses an HDFC debit SMS', () => {
    const result = parseWithRegistry(
      'HDFCBK',
      'Rs 2,499.00 debited from a/c XX5678 on 24-08-26 to SWIGGY. UPI Ref 123456789012. Avl Bal Rs 10,000.00',
    );
    expect(result?.bankKey).toBe('HDFC');
    expect(result?.direction).toBe('debit');
    expect(result?.amount).toBe(2499);
    expect(result?.accountLast4).toBe('5678');
    expect(result?.referenceId).toBe('123456789012');
  });

  it('parses an ICICI credit SMS', () => {
    const result = parseWithRegistry(
      'ICICIB',
      'INR 799.00 credited to your A/c XX9876 on 25-Aug-26 from VPA friend@okicici. Ref 998877665544 -ICICI Bank',
    );
    expect(result?.bankKey).toBe('ICICI');
    expect(result?.direction).toBe('credit');
    expect(result?.amount).toBe(799);
    expect(result?.accountLast4).toBe('9876');
    expect(result?.upiId).toBe('friend@okicici');
  });

  it('parses an Axis card transaction SMS', () => {
    const result = parseWithRegistry(
      'AXISBK',
      'Rs.3,200.00 spent on your Axis Bank Card ending 4321 at FLIPKART on 23-08-2026.',
    );
    expect(result?.bankKey).toBe('AXIS');
    expect(result?.direction).toBe('debit');
    expect(result?.amount).toBe(3200);
    expect(result?.accountLast4).toBe('4321');
  });

  it('parses a Kotak ATM withdrawal SMS', () => {
    const result = parseWithRegistry(
      'KOTAKB',
      'Rs 500.00 withdrawn from A/c XX1111 at ATM on 22-08-26. Avl Bal Rs 4,500.00 -Kotak Bank',
    );
    expect(result?.bankKey).toBe('KOTAK');
    expect(result?.direction).toBe('debit');
    expect(result?.amount).toBe(500);
    expect(result?.accountLast4).toBe('1111');
  });

  it('parses an Indian Bank debit SMS', () => {
    const result = parseWithRegistry(
      'INDBNK',
      'Your A/c XX2222 is debited with INR 1,299.00 on 25-08-2026 towards UBER. Ref IB99887766 -Indian Bank',
    );
    expect(result?.bankKey).toBe('INDIAN_BANK');
    expect(result?.direction).toBe('debit');
    expect(result?.amount).toBe(1299);
    expect(result?.referenceId).toBe('IB99887766');
  });

  it('parses a PhonePe UPI payment SMS', () => {
    const result = parseWithRegistry(
      'PHONPE',
      'You paid Rs.350 to ZOMATO using PhonePe UPI. UPI transaction ID T2608251234567890',
    );
    expect(result?.bankKey).toBe('PHONEPE');
    expect(result?.direction).toBe('debit');
    expect(result?.amount).toBe(350);
  });

  it('parses a Google Pay credit SMS', () => {
    const result = parseWithRegistry(
      'GPAY',
      '₹50,000 credited to account XX1234 via Google Pay. UPI Ref 887766554433',
    );
    expect(result?.bankKey).toBe('GPAY');
    expect(result?.direction).toBe('credit');
    expect(result?.amount).toBe(50000);
  });

  it('parses a Paytm payment SMS', () => {
    const result = parseWithRegistry('PAYTM', 'Paid Rs.199 to PAYTM MALL via Paytm wallet.');
    expect(result?.bankKey).toBe('PAYTM');
    expect(result?.direction).toBe('debit');
    expect(result?.amount).toBe(199);
  });

  it('parses a generic card-network SMS', () => {
    const result = parseWithRegistry(
      'VM-VISA-ALRT',
      'Rs 4,500.00 spent on your VISA Card ending 7890 at BIGBAZAAR on 20-08-2026.',
    );
    expect(result?.bankKey).toBe('CARD_GENERIC');
    expect(result?.accountLast4).toBe('7890');
  });

  it('falls back to the generic UPI parser for an unrecognized sender', () => {
    const result = parseWithRegistry(
      'XY-UNKBNK',
      'Rs.100.00 debited from A/c XX0000 to CHAIWALA on 19-08-26. Ref 111222333.',
    );
    expect(result?.bankKey).toBe('UPI_GENERIC');
    expect(result?.amount).toBe(100);
  });

  it('still extracts amount/direction when the account number is missing', () => {
    const result = parseWithRegistry(
      'HDFCBK',
      'Rs 250.00 debited to CHAIWALA via UPI. Ref 555666777.',
    );
    expect(result).not.toBeNull();
    expect(result?.accountLast4).toBeUndefined();
  });

  it('still extracts amount/direction when the merchant is missing', () => {
    const result = parseWithRegistry('HDFCBK', 'Rs 250.00 debited from A/c XX4444. Ref 555666777.');
    expect(result).not.toBeNull();
    expect(result?.merchant).toBeUndefined();
  });

  it('returns null when the direction is ambiguous (both debit and credit wording present)', () => {
    const result = parseWithRegistry(
      'HDFCBK',
      'Rs 100.00 debited from A/c XX1234 and Rs 100.00 credited to A/c XX5678 as part of a sweep transfer.',
    );
    expect(result).toBeNull();
  });

  it('returns null when there is no amount to extract', () => {
    const result = parseWithRegistry('HDFCBK', 'Your account was debited successfully. -HDFC Bank');
    expect(result).toBeNull();
  });
});
