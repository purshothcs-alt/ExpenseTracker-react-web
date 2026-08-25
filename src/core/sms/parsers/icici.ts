import { makeBankParser } from './makeBankParser';

export const iciciParser = makeBankParser({
  key: 'ICICI',
  name: 'ICICI Bank',
  senderPatterns: [/ICICI/i],
  baseConfidence: 80,
});
