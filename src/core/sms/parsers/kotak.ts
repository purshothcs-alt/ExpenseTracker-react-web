import { makeBankParser } from './makeBankParser';

export const kotakParser = makeBankParser({
  key: 'KOTAK',
  name: 'Kotak Mahindra Bank',
  senderPatterns: [/KOTAK/i],
  baseConfidence: 80,
});
