import db from '../db';
import type {
  Transaction,
  TransactionFilter,
  PaginatedResult,
  TransactionWithDetails,
} from '../types';

export class TransactionRepository {
  async getFiltered(filter: TransactionFilter): Promise<PaginatedResult<Transaction>> {
    let collection = db.transactions.toCollection();

    if (filter.accountId) {
      collection = db.transactions.where('accountId').equals(filter.accountId);
    }

    const allItems = await collection.toArray();

    let filtered = allItems.filter((t) => {
      if (filter.startDate && t.transactionDate < filter.startDate) return false;
      if (filter.endDate && t.transactionDate > filter.endDate) return false;
      if (filter.transactionTypeId && t.transactionTypeId !== filter.transactionTypeId)
        return false;
      if (
        filter.categoryId &&
        t.categoryId !== filter.categoryId &&
        t.subCategoryId !== filter.categoryId
      )
        return false;
      if (filter.projectId && t.projectId !== filter.projectId) return false;
      if (filter.minAmount !== undefined && t.amount < filter.minAmount) return false;
      if (filter.maxAmount !== undefined && t.amount > filter.maxAmount) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        if (!t.notes?.toLowerCase().includes(s) && !t.vendor?.toLowerCase().includes(s))
          return false;
      }
      return true;
    });

    if (filter.tagIds && filter.tagIds.length > 0) {
      const taggedTxIds = new Set(
        (await db.transactionTags.where('tagId').anyOf(filter.tagIds).toArray()).map(
          (tt) => tt.transactionId,
        ),
      );
      filtered = filtered.filter((t) => taggedTxIds.has(t.id!));
    }

    const sortBy = (filter.sortBy || 'transactionDate') as keyof Transaction;
    const sortOrder = filter.sortOrder || 'desc';
    filtered.sort((a, b) => {
      const aVal = a[sortBy] as string | number;
      const bVal = b[sortBy] as string | number;
      return sortOrder === 'desc' ? (aVal < bVal ? 1 : -1) : aVal > bVal ? 1 : -1;
    });

    const total = filtered.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getWithDetails(id: number): Promise<TransactionWithDetails | undefined> {
    const tx = await db.transactions.get(id);
    if (!tx) return undefined;
    return this.enrichTransaction(tx);
  }

  async enrichTransaction(tx: Transaction): Promise<TransactionWithDetails> {
    const [account, toAccount, transactionType, category, subCategory, txTags] = await Promise.all([
      db.accounts.get(tx.accountId),
      tx.toAccountId ? db.accounts.get(tx.toAccountId) : Promise.resolve(undefined),
      db.transactionTypes.get(tx.transactionTypeId),
      tx.categoryId ? db.categories.get(tx.categoryId) : Promise.resolve(undefined),
      tx.subCategoryId ? db.categories.get(tx.subCategoryId) : Promise.resolve(undefined),
      db.transactionTags.where('transactionId').equals(tx.id!).toArray(),
    ]);

    const tagIds = txTags.map((tt) => tt.tagId);
    const tags = tagIds.length > 0 ? await db.tags.where('id').anyOf(tagIds).toArray() : [];
    const project = tx.projectId ? await db.projects.get(tx.projectId) : undefined;

    return { ...tx, account, toAccount, transactionType, category, subCategory, tags, project };
  }

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    tagIds?: number[],
  ): Promise<number> {
    const ts = new Date().toISOString();
    const id = await db.transactions.add({ ...data, createdAt: ts, updatedAt: ts } as Transaction);

    if (tagIds && tagIds.length > 0) {
      await db.transactionTags.bulkAdd(
        tagIds.map((tagId) => ({ transactionId: id as number, tagId })),
      );
    }

    await this.updateAccountBalance(data.accountId);
    if (data.toAccountId) await this.updateAccountBalance(data.toAccountId);

    return id as number;
  }

  async update(id: number, data: Partial<Transaction>, tagIds?: number[]): Promise<void> {
    const existing = await db.transactions.get(id);
    await db.transactions.update(id, { ...data, updatedAt: new Date().toISOString() });

    if (tagIds !== undefined) {
      await db.transactionTags.where('transactionId').equals(id).delete();
      if (tagIds.length > 0) {
        await db.transactionTags.bulkAdd(tagIds.map((tagId) => ({ transactionId: id, tagId })));
      }
    }

    if (existing) {
      await this.updateAccountBalance(existing.accountId);
      if (existing.toAccountId) await this.updateAccountBalance(existing.toAccountId);
    }
    if (data.accountId) await this.updateAccountBalance(data.accountId);
    if (data.toAccountId) await this.updateAccountBalance(data.toAccountId);
  }

  async delete(id: number): Promise<void> {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    await db.transactionTags.where('transactionId').equals(id).delete();
    await db.transactions.delete(id);

    await this.updateAccountBalance(tx.accountId);
    if (tx.toAccountId) await this.updateAccountBalance(tx.toAccountId);
  }

  private async updateAccountBalance(accountId: number): Promise<void> {
    const account = await db.accounts.get(accountId);
    if (!account) return;

    const txTypes = await db.transactionTypes.toArray();
    const creditTypes = txTypes.filter((t) => t.direction === 'credit').map((t) => t.id!);
    const debitTypes = txTypes.filter((t) => t.direction === 'debit').map((t) => t.id!);

    const allTxs = await db.transactions.where('accountId').equals(accountId).toArray();
    const transfersTo = await db.transactions.where('toAccountId').equals(accountId).toArray();

    const credits = allTxs.filter((t) => creditTypes.includes(t.transactionTypeId));
    const debits = allTxs.filter((t) => debitTypes.includes(t.transactionTypeId));
    const transfersFrom = allTxs.filter(
      (t) =>
        !creditTypes.includes(t.transactionTypeId) && !debitTypes.includes(t.transactionTypeId),
    );

    const totalCredit = credits.reduce((s, t) => s + t.amount, 0);
    const totalDebit = debits.reduce((s, t) => s + t.amount, 0);
    const transferIn = transfersTo.reduce((s, t) => s + t.amount, 0);
    const transferOut = transfersFrom.reduce((s, t) => s + t.amount, 0);

    const currentBalance =
      account.openingBalance + totalCredit - totalDebit + transferIn - transferOut;
    await db.accounts.update(accountId, { currentBalance });
  }

  async getSummaryByMonth(
    months = 12,
  ): Promise<Array<{ month: string; income: number; expense: number }>> {
    const txTypes = await db.transactionTypes.toArray();
    const creditTypes = new Set(txTypes.filter((t) => t.direction === 'credit').map((t) => t.id!));
    const debitTypes = new Set(txTypes.filter((t) => t.direction === 'debit').map((t) => t.id!));

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const txs = await db.transactions
      .filter((t) => t.transactionDate >= since.toISOString().split('T')[0])
      .toArray();

    const monthMap: Record<string, { income: number; expense: number }> = {};

    txs.forEach((t) => {
      const month = t.transactionDate.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
      if (creditTypes.has(t.transactionTypeId)) monthMap[month].income += t.amount;
      if (debitTypes.has(t.transactionTypeId)) monthMap[month].expense += t.amount;
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  async getCategoryTotals(
    startDate: string,
    endDate: string,
  ): Promise<Array<{ categoryId: number; total: number }>> {
    const txTypes = await db.transactionTypes.toArray();
    const debitTypes = new Set(txTypes.filter((t) => t.direction === 'debit').map((t) => t.id!));

    const txs = await db.transactions
      .filter(
        (t) =>
          t.transactionDate >= startDate &&
          t.transactionDate <= endDate &&
          debitTypes.has(t.transactionTypeId),
      )
      .toArray();

    const catMap: Record<number, number> = {};
    txs.forEach((t) => {
      const catId = t.subCategoryId || t.categoryId;
      if (catId) {
        catMap[catId] = (catMap[catId] || 0) + t.amount;
      }
    });

    return Object.entries(catMap)
      .map(([categoryId, total]) => ({ categoryId: Number(categoryId), total }))
      .sort((a, b) => b.total - a.total);
  }
}

export const transactionRepository = new TransactionRepository();
