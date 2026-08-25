import { makeBankParser } from './makeBankParser';

export const phonePeParser = makeBankParser({
  key: 'PHONEPE',
  name: 'PhonePe',
  senderPatterns: [/PHONPE/i, /PHONEPE/i],
  baseConfidence: 72,
});
