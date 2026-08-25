import { makeBankParser } from './makeBankParser';

export const indianBankParser = makeBankParser({
  key: 'INDIAN_BANK',
  name: 'Indian Bank',
  senderPatterns: [/INDBNK/i, /INDBK/i, /IND-?BANK/i],
  baseConfidence: 78,
});
