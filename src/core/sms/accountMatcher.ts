import db from '@core/database/db';
import type { Account } from '@core/database/types';

/**
 * Matches an SMS-extracted "last 4 digits" fragment against existing
 * accounts. Never creates an account — an unmatched last-4 simply leaves
 * matchedAccountId unset so the user picks the right account during review
 * (requirement: no silent account creation).
 */
export async function matchAccountByLast4(last4: string | undefined): Promise<Account | undefined> {
  if (!last4) return undefined;
  const accounts = await db.accounts.filter((a) => a.isActive !== false).toArray();
  return accounts.find((a) => a.accountNumberLast4 === last4);
}
