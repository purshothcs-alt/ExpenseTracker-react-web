import db from '../db';
import dayjs from 'dayjs';
import type {
  Transaction,
  TransactionFilter,
  TransactionListItem,
  PaginatedResult,
  TransactionWithDetails,
  ReportGroupBy,
  GroupedTotal,
} from '../types';

const NO_VALUE_LABELS: Record<ReportGroupBy, string> = {
  account: '(No account)',
  category: '(No category)',
  subCategory: '(No sub category)',
  tag: '(No tag)',
  payee: '(No payee)',
  project: '(No project)',
};

export class TransactionRepository {
  async getFiltered(filter: TransactionFilter): Promise<PaginatedResult<TransactionListItem>> {
    const filtered = await this.queryFiltered(filter);

    const total = filtered.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /** Every transaction matching the filter, ignoring pagination (used for "all records" exports). */
  async getAllFiltered(filter: TransactionFilter): Promise<TransactionListItem[]> {
    return this.queryFiltered(filter);
  }

  private async queryFiltered(filter: TransactionFilter): Promise<TransactionListItem[]> {
    let collection = db.transactions.toCollection();

    if (filter.accountId) {
      collection = db.transactions.where('accountId').equals(filter.accountId);
    }

    const [allItems, txTags] = await Promise.all([
      collection.toArray(),
      db.transactionTags.toArray(),
    ]);

    const tagsByTx = new Map<number, number[]>();
    txTags.forEach((tt) => {
      const list = tagsByTx.get(tt.transactionId);
      if (list) list.push(tt.tagId);
      else tagsByTx.set(tt.transactionId, [tt.tagId]);
    });

    const vendor = filter.vendor?.trim().toLowerCase();
    const searchTerms = (filter.search || '').toLowerCase().split(/\s+/).filter(Boolean);
    const searchText = searchTerms.length > 0 ? await this.buildSearchText(tagsByTx) : undefined;

    const filtered = allItems.filter((t) => {
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
      if (filter.subCategoryId && t.subCategoryId !== filter.subCategoryId) return false;
      if (filter.projectId && t.projectId !== filter.projectId) return false;
      if (vendor && (t.vendor || '').trim().toLowerCase() !== vendor) return false;
      if (filter.minAmount !== undefined && t.amount < filter.minAmount) return false;
      if (filter.maxAmount !== undefined && t.amount > filter.maxAmount) return false;
      if (filter.tagIds && filter.tagIds.length > 0) {
        const txTagIds = tagsByTx.get(t.id!) || [];
        if (!filter.tagIds.some((id) => txTagIds.includes(id))) return false;
      }
      if (searchText) {
        const haystack = searchText(t);
        if (!searchTerms.every((term) => haystack.includes(term))) return false;
      }
      return true;
    });

    const sortBy = (filter.sortBy || 'transactionDate') as keyof Transaction;
    const dir = (filter.sortOrder || 'desc') === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = a[sortBy] as string | number;
      const bVal = b[sortBy] as string | number;
      if (aVal === bVal) return ((a.id || 0) - (b.id || 0)) * dir;
      return (aVal > bVal ? 1 : -1) * dir;
    });

    return filtered.map((t) => ({ ...t, tagIds: tagsByTx.get(t.id!) || [] }));
  }

  /**
   * Builds the lowercase text a free-text search is matched against, covering every
   * column shown for a transaction (names are resolved from their lookup tables).
   */
  private async buildSearchText(
    tagsByTx: Map<number, number[]>,
  ): Promise<(t: Transaction) => string> {
    const [accounts, txTypes, categories, tags, projects] = await Promise.all([
      db.accounts.toArray(),
      db.transactionTypes.toArray(),
      db.categories.toArray(),
      db.tags.toArray(),
      db.projects.toArray(),
    ]);
    const accName = new Map(accounts.map((a) => [a.id!, a.name]));
    const typeName = new Map(txTypes.map((t) => [t.id!, t.name]));
    const catName = new Map(categories.map((c) => [c.id!, c.name]));
    const tagName = new Map(tags.map((t) => [t.id!, t.name]));
    const projName = new Map(projects.map((p) => [p.id!, p.name]));

    return (t) => {
      const date = dayjs(t.transactionDate);
      return [
        t.notes,
        t.vendor,
        t.referenceNumber,
        t.transactionDate,
        date.isValid() ? date.format('DD/MM/YYYY DD-MM-YYYY DD MMM YYYY MMMM') : '',
        String(t.amount),
        t.amount.toFixed(2),
        accName.get(t.accountId),
        t.toAccountId ? accName.get(t.toAccountId) : '',
        typeName.get(t.transactionTypeId),
        t.categoryId ? catName.get(t.categoryId) : '',
        t.subCategoryId ? catName.get(t.subCategoryId) : '',
        t.projectId ? projName.get(t.projectId) : '',
        ...(tagsByTx.get(t.id!) || []).map((id) => tagName.get(id)),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    };
  }

  /** Distinct vendor / payee names used on transactions, for filter pickers. */
  async getVendors(): Promise<string[]> {
    const seen = new Map<string, string>();
    await db.transactions.each((t) => {
      const name = t.vendor?.trim();
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    });
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Income / expense totals for a date range grouped by one dimension. Transfers are
   * excluded. A transaction with several tags counts towards each of its tags.
   */
  async getGroupedTotals(
    groupBy: ReportGroupBy,
    startDate: string,
    endDate: string,
  ): Promise<GroupedTotal[]> {
    const txTypes = await db.transactionTypes.toArray();
    const creditTypes = new Set(txTypes.filter((t) => t.direction === 'credit').map((t) => t.id!));
    const debitTypes = new Set(txTypes.filter((t) => t.direction === 'debit').map((t) => t.id!));

    const txs = await db.transactions
      .filter(
        (t) =>
          t.transactionDate >= startDate &&
          t.transactionDate <= endDate &&
          (creditTypes.has(t.transactionTypeId) || debitTypes.has(t.transactionTypeId)),
      )
      .toArray();

    const meta = new Map<string, { name: string; color?: string; parentName?: string }>();
    const tagsByTx = new Map<number, number[]>();

    if (groupBy === 'account') {
      (await db.accounts.toArray()).forEach((a) => meta.set(String(a.id), { name: a.name }));
    } else if (groupBy === 'category' || groupBy === 'subCategory') {
      const categories = await db.categories.toArray();
      const byId = new Map(categories.map((c) => [c.id!, c]));
      categories.forEach((c) =>
        meta.set(String(c.id), {
          name: c.name,
          color: c.color,
          parentName: c.parentId ? byId.get(c.parentId)?.name : undefined,
        }),
      );
    } else if (groupBy === 'project') {
      (await db.projects.toArray()).forEach((p) =>
        meta.set(String(p.id), { name: p.name, color: p.color }),
      );
    } else if (groupBy === 'tag') {
      (await db.tags.toArray()).forEach((t) =>
        meta.set(String(t.id), { name: t.name, color: t.color }),
      );
      (await db.transactionTags.toArray()).forEach((tt) => {
        const list = tagsByTx.get(tt.transactionId);
        if (list) list.push(tt.tagId);
        else tagsByTx.set(tt.transactionId, [tt.tagId]);
      });
    }

    const keysOf = (t: Transaction): string[] => {
      switch (groupBy) {
        case 'account':
          return [String(t.accountId)];
        case 'category':
          return [t.categoryId ? String(t.categoryId) : ''];
        case 'subCategory':
          return [t.subCategoryId ? String(t.subCategoryId) : ''];
        case 'project':
          return [t.projectId ? String(t.projectId) : ''];
        case 'payee': {
          const name = t.vendor?.trim();
          if (!name) return [''];
          const key = name.toLowerCase();
          if (!meta.has(key)) meta.set(key, { name });
          return [key];
        }
        case 'tag': {
          const ids = tagsByTx.get(t.id!) || [];
          return ids.length > 0 ? ids.map(String) : [''];
        }
      }
    };

    const groups = new Map<string, GroupedTotal>();
    txs.forEach((t) => {
      keysOf(t).forEach((key) => {
        let group = groups.get(key);
        if (!group) {
          const info = key ? meta.get(key) : undefined;
          group = {
            key,
            name: key ? info?.name || 'Unknown' : NO_VALUE_LABELS[groupBy],
            color: info?.color,
            parentName: info?.parentName,
            income: 0,
            expense: 0,
            count: 0,
          };
          groups.set(key, group);
        }
        if (creditTypes.has(t.transactionTypeId)) group.income += t.amount;
        else group.expense += t.amount;
        group.count += 1;
      });
    });

    // Largest spend first; the "no value" bucket always goes last.
    return [...groups.values()].sort((a, b) => {
      if (!a.key !== !b.key) return a.key ? -1 : 1;
      return b.expense - a.expense || b.income - a.income;
    });
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

    const created = await db.transactions.get(id as number);
    if (created) await this.syncProjectExpense(created);

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

    const updated = await db.transactions.get(id);
    if (updated) await this.syncProjectExpense(updated);
  }

  async delete(id: number): Promise<void> {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    await db.transactionTags.where('transactionId').equals(id).delete();
    await db.projectExpenses.where('transactionId').equals(id).delete();
    await db.transactions.delete(id);

    await this.updateAccountBalance(tx.accountId);
    if (tx.toAccountId) await this.updateAccountBalance(tx.toAccountId);
  }

  /**
   * Keeps a project's expense ledger in sync with transactions tagged to it.
   * Only debit (expense) transactions produce a ProjectExpense; income/transfer
   * transactions, or removing the project tag, clear any previously synced entry.
   */
  private async syncProjectExpense(tx: Transaction): Promise<void> {
    const existingExpense = await db.projectExpenses.where('transactionId').equals(tx.id!).first();

    let isDebit = false;
    if (tx.projectId) {
      const txType = await db.transactionTypes.get(tx.transactionTypeId);
      isDebit = txType?.direction === 'debit';
    }

    if (tx.projectId && isDebit) {
      const ts = new Date().toISOString();
      const expenseData = {
        projectId: tx.projectId,
        categoryId: tx.categoryId,
        description: tx.notes || tx.vendor || 'Transaction expense',
        amount: tx.amount,
        expenseDate: tx.transactionDate,
        vendor: tx.vendor,
        notes: tx.notes,
        transactionId: tx.id,
      };
      if (existingExpense) {
        await db.projectExpenses.update(existingExpense.id!, { ...expenseData, updatedAt: ts });
      } else {
        await db.projectExpenses.add({ ...expenseData, createdAt: ts, updatedAt: ts });
      }
    } else if (existingExpense) {
      await db.projectExpenses.delete(existingExpense.id!);
    }
  }

  async updateAccountBalance(accountId: number): Promise<void> {
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
