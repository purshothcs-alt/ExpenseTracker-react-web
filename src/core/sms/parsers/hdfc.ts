import { makeBankParser } from './makeBankParser';

export const hdfcParser = makeBankParser({
  key: 'HDFC',
  name: 'HDFC Bank',
  senderPatterns: [/HDFC/i],
  baseConfidence: 80,
});
