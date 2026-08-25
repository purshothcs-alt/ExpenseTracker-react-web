import type { BankParser, BankParseResult } from '../types';
import { sbiParser } from './sbi';
import { hdfcParser } from './hdfc';
import { iciciParser } from './icici';
import { axisParser } from './axis';
import { kotakParser } from './kotak';
import { indianBankParser } from './indianBank';
import { phonePeParser } from './phonepe';
import { gpayParser } from './gpay';
import { paytmParser } from './paytm';
import { cardParser } from './card';
import { upiGenericParser } from './upiGeneric';

/**
 * Ordered list of known parsers, checked by sender header. The generic UPI
 * fallback matches everything and must stay last. To add a new bank or
 * payment provider: write a new parser (see makeBankParser.ts) and add it
 * here, above upiGenericParser.
 */
export const BANK_PARSER_REGISTRY: BankParser[] = [
  sbiParser,
  hdfcParser,
  iciciParser,
  axisParser,
  kotakParser,
  indianBankParser,
  phonePeParser,
  gpayParser,
  paytmParser,
  cardParser,
  upiGenericParser,
];

/**
 * Parses an SMS body using the first parser whose sender pattern matches.
 * Returns null only if the matching parser couldn't extract a usable
 * amount/direction (the generic fallback still runs, so this is rare —
 * it means the message had neither).
 */
export function parseWithRegistry(sender: string, body: string): BankParseResult | null {
  const parser = BANK_PARSER_REGISTRY.find((p) => p.matchesSender(sender));
  const effectiveParser = parser ?? upiGenericParser;
  return effectiveParser.parse(body);
}
