import db from '../db';
import { transactionRepository } from './TransactionRepository';
import type {
  PendingSmsTransaction,
  PendingSmsTransactionWithDetails,
  SmsTransactionStatus,
  Transaction,
} from '../types';

export class PendingSmsTransactionRepository {
  async list(status?: SmsTransactionStatus): Promise<PendingSmsTransactionWithDetails[]> {
    const rows = status
      ? await db.pendingSmsTransactions.where('status').equals(status).toArray()
      : await db.pendingSmsTransactions.toArray();

    rows.sort((a, b) => b.smsTimestamp.localeCompare(a.smsTimestamp));

    const accountIds = [
      ...new Set(rows.map((r) => r.matchedAccountId).filter(Boolean)),
    ] as number[];
    const categoryIds = [
      ...new Set(rows.map((r) => r.suggestedCategoryId).filter(Boolean)),
    ] as number[];

    const [accounts, categories] = await Promise.all([
      accountIds.length ? db.accounts.where('id').anyOf(accountIds).toArray() : [],
      categoryIds.length ? db.categories.where('id').anyOf(categoryIds).toArray() : [],
    ]);
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));
    const categoryMap = new Map(categories.map((c) => [c.id!, c]));

    return rows.map((r) => ({
      ...r,
      matchedAccount: r.matchedAccountId ? accountMap.get(r.matchedAccountId) : undefined,
      suggestedCategory: r.suggestedCategoryId ? categoryMap.get(r.suggestedCategoryId) : undefined,
    }));
  }

  async getById(id: number): Promise<PendingSmsTransaction | undefined> {
    return db.pendingSmsTransactions.get(id);
  }

  async create(
    data: Omit<PendingSmsTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<number> {
    const ts = new Date().toISOString();
    const id = await db.pendingSmsTransactions.add({ ...data, createdAt: ts, updatedAt: ts });
    return id as number;
  }

  async update(id: number, data: Partial<PendingSmsTransaction>): Promise<void> {
    await db.pendingSmsTransactions.update(id, { ...data, updatedAt: new Date().toISOString() });
  }

  /**
   * Creates the real Transaction via the existing transaction service (so
   * balance recalculation, project-expense sync, etc. all run exactly as
   * they do for a manually-entered transaction), then marks this SMS
   * record approved and clears its raw SMS text.
   */
  async approve(
    id: number,
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    tagIds?: number[],
  ): Promise<number> {
    const transactionId = await transactionRepository.create(transactionData, tagIds);
    await db.pendingSmsTransactions.update(id, {
      status: 'approved',
      resultingTransactionId: transactionId,
      rawText: undefined,
      updatedAt: new Date().toISOString(),
    });
    return transactionId;
  }

  async ignore(id: number): Promise<void> {
    await db.pendingSmsTransactions.update(id, {
      status: 'ignored',
      rawText: undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  /** Privacy control: permanently deletes resolved (approved/ignored) SMS import history. */
  async clearResolvedHistory(): Promise<number> {
    const resolved = await db.pendingSmsTransactions
      .where('status')
      .anyOf(['approved', 'ignored'])
      .primaryKeys();
    await db.pendingSmsTransactions.bulkDelete(resolved);
    return resolved.length;
  }
}

export const pendingSmsTransactionRepository = new PendingSmsTransactionRepository();
