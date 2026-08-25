import { makeBankParser } from './makeBankParser';

export const gpayParser = makeBankParser({
  key: 'GPAY',
  name: 'Google Pay',
  senderPatterns: [/GPAY/i, /GOOGLEPAY/i],
  baseConfidence: 72,
});
