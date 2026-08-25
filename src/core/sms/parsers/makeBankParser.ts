import { parseCommonFields } from './common';
import type { BankParser, BankParseResult } from '../types';

/**
 * Factory for a bank/UPI parser that relies entirely on the shared
 * extractors in ./common.ts, differing only in which sender headers it
 * claims and how confident a match from those headers should be. Most
 * Indian bank transaction SMS share near-identical phrasing, so this
 * covers the common case; a bank with genuinely different phrasing can
 * still supply a custom `parse` override.
 */
export function makeBankParser(options: {
  key: string;
  name: string;
  senderPatterns: RegExp[];
  baseConfidence: number;
  parse?: (body: string) => BankParseResult | null;
}): BankParser {
  const { key, name, senderPatterns, baseConfidence, parse } = options;

  return {
    key,
    name,
    matchesSender: (sender: string) => senderPatterns.some((p) => p.test(sender)),
    parse:
      parse ??
      ((body: string): BankParseResult | null => {
        const fields = parseCommonFields(body);
        if (!fields.amount || !fields.direction) return null;
        return {
          bankKey: key,
          direction: fields.direction,
          amount: fields.amount,
          accountLast4: fields.accountLast4,
          merchant: fields.merchant,
          upiId: fields.upiId,
          referenceId: fields.referenceId,
          baseConfidence,
        };
      }),
  };
}
