import { makeBankParser } from './makeBankParser';

export const axisParser = makeBankParser({
  key: 'AXIS',
  name: 'Axis Bank',
  senderPatterns: [/AXIS/i],
  baseConfidence: 80,
});
