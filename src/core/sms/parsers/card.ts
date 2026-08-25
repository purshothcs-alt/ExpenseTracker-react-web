import { makeBankParser } from './makeBankParser';

/**
 * Generic debit/credit card transaction parser. Card SMS are usually sent
 * from the same bank headers as regular bank SMS (handled by the bank-
 * specific parsers above); this exists as a lower-priority fallback for
 * card networks that send from their own header (e.g. "VISA", "RUPAY")
 * rather than the issuing bank.
 */
export const cardParser = makeBankParser({
  key: 'CARD_GENERIC',
  name: 'Card Network',
  senderPatterns: [/\bVISA\b/i, /\bRUPAY\b/i, /\bMASTERCARD\b/i],
  baseConfidence: 65,
});
