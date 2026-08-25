import { makeBankParser } from './makeBankParser';

export const sbiParser = makeBankParser({
  key: 'SBI',
  name: 'State Bank of India',
  senderPatterns: [/SBI/i],
  baseConfidence: 80,
});
