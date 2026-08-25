import { makeBankParser } from './makeBankParser';

/**
 * Fallback parser used when no sender-specific parser claims the message
 * but the SMS still passed the transaction detector (see ../detector.ts).
 * Always matches — must be registered last in the registry. Lower base
 * confidence reflects that the sending bank/app couldn't be identified.
 */
export const upiGenericParser = makeBankParser({
  key: 'UPI_GENERIC',
  name: 'Unrecognized bank/UPI sender',
  senderPatterns: [/.*/],
  baseConfidence: 50,
});
