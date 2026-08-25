import { makeBankParser } from './makeBankParser';

export const paytmParser = makeBankParser({
  key: 'PAYTM',
  name: 'Paytm',
  senderPatterns: [/PAYTM/i],
  baseConfidence: 72,
});
