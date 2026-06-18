import db from '../db';
import {
  seedAccountTypes, seedTransactionTypes, seedCategories, seedSubCategories,
  seedTags, seedGoalTypes, seedLoanTypes, seedAssetTypes, seedBudgetTypes,
  seedIncomeTypes, seedDashboardWidgets, seedReportTemplates,
  generateSampleTransactions, seedAccounts, seedGoals, seedAssets,
  seedBudgets, seedRecurring,
} from './seedData';
import type { Category } from '../types';

export async function isDatabaseSeeded(): Promise<boolean> {
  const count = await db.accountTypes.count();
  return count > 0;
}

export async function seedDatabase(): Promise<void> {
  const alreadySeeded = await isDatabaseSeeded();
  if (alreadySeeded) return;

  await db.transaction('rw', [
    db.settings, db.accountTypes, db.accounts, db.transactionTypes,
    db.categories, db.tags, db.goalTypes, db.goals, db.loanTypes,
    db.assetTypes, db.assets, db.budgetTypes, db.budgets,
    db.incomeTypes, db.dashboardWidgets, db.userDashboardConfig,
    db.reportTemplates, db.transactions, db.recurringTransactions,
  ], async () => {
    await db.settings.bulkAdd([
      { key: 'appName', value: 'Expense Tracker Pro', updatedAt: new Date().toISOString() },
      { key: 'currency', value: 'INR', updatedAt: new Date().toISOString() },
      { key: 'currencySymbol', value: '₹', updatedAt: new Date().toISOString() },
      { key: 'themeMode', value: 'light', updatedAt: new Date().toISOString() },
      { key: 'dateFormat', value: 'DD/MM/YYYY', updatedAt: new Date().toISOString() },
      { key: 'timeFormat', value: 'HH:mm', updatedAt: new Date().toISOString() },
      { key: 'language', value: 'en', updatedAt: new Date().toISOString() },
      { key: 'firstDayOfWeek', value: '1', updatedAt: new Date().toISOString() },
      { key: 'decimalSeparator', value: '.', updatedAt: new Date().toISOString() },
      { key: 'thousandSeparator', value: ',', updatedAt: new Date().toISOString() },
      { key: 'showCentsInDashboard', value: 'false', updatedAt: new Date().toISOString() },
      { key: 'autoBackup', value: 'false', updatedAt: new Date().toISOString() },
    ]);

    const accountTypeIds = await db.accountTypes.bulkAdd(seedAccountTypes, { allKeys: true });
    const accountTypesWithIds = seedAccountTypes.map((t, i) => ({ ...t, id: accountTypeIds[i] as number }));

    const txTypeIds = await db.transactionTypes.bulkAdd(seedTransactionTypes, { allKeys: true });
    const txTypesWithIds = seedTransactionTypes.map((t, i) => ({ ...t, id: txTypeIds[i] as number }));
    const incomeType = txTypesWithIds.find(t => t.name === 'Income')!;
    const expenseType = txTypesWithIds.find(t => t.name === 'Expense')!;

    const catIds = await db.categories.bulkAdd(seedCategories, { allKeys: true });
    const catsWithIds: Category[] = seedCategories.map((c, i) => ({ ...c, id: catIds[i] as number }));
    const catMap: Record<string, number> = {};
    catsWithIds.forEach(c => { catMap[c.name] = c.id!; });

    const subCats = seedSubCategories(catMap);
    await db.categories.bulkAdd(subCats);
    const allCategories = await db.categories.toArray();

    await db.tags.bulkAdd(seedTags);
    await db.goalTypes.bulkAdd(seedGoalTypes);
    await db.loanTypes.bulkAdd(seedLoanTypes);
    await db.assetTypes.bulkAdd(seedAssetTypes);
    await db.budgetTypes.bulkAdd(seedBudgetTypes);
    await db.incomeTypes.bulkAdd(seedIncomeTypes);

    const widgetIds = await db.dashboardWidgets.bulkAdd(seedDashboardWidgets, { allKeys: true });
    const defaultWidgetKeys = ['current-balance', 'monthly-income', 'monthly-expense', 'cash-flow', 'recent-transactions', 'account-balances', 'top-categories', 'income-expense-chart'];
    const widgets = await db.dashboardWidgets.toArray();
    const defaultWidgets = widgets.filter(w => defaultWidgetKeys.includes(w.componentKey));
    const dashboardConfigs = defaultWidgets.map((w, i) => ({
      widgetId: w.id!,
      positionX: i % 4,
      positionY: Math.floor(i / 4),
      width: w.componentKey === 'income-expense-chart' ? 3 : ['recent-transactions'].includes(w.componentKey) ? 2 : 1,
      height: ['recent-transactions', 'account-balances', 'top-categories', 'income-expense-chart'].includes(w.componentKey) ? 2 : 1,
      config: w.defaultConfig,
      isVisible: true,
      displayOrder: i + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await db.userDashboardConfig.bulkAdd(dashboardConfigs);

    void widgetIds;

    await db.reportTemplates.bulkAdd(seedReportTemplates);

    const accountsData = seedAccounts(accountTypesWithIds);
    const accountIds = await db.accounts.bulkAdd(accountsData, { allKeys: true });
    const accountsWithIds = accountsData.map((a, i) => ({ ...a, id: accountIds[i] as number }));

    const goalTypesData = await db.goalTypes.toArray();
    await db.goals.bulkAdd(seedGoals(goalTypesData));

    const assetTypesData = await db.assetTypes.toArray();
    await db.assets.bulkAdd(seedAssets(assetTypesData));

    await db.budgets.bulkAdd(seedBudgets(allCategories));

    const transactions = generateSampleTransactions(
      accountsWithIds, allCategories, incomeType.id!, expenseType.id!,
    );
    await db.transactions.bulkAdd(transactions);

    await db.recurringTransactions.bulkAdd(
      seedRecurring(accountsWithIds, allCategories, expenseType.id!, incomeType.id!),
    );

    for (const acc of accountsWithIds) {
      const credits = await db.transactions
        .where('accountId').equals(acc.id!)
        .and(t => t.transactionTypeId === incomeType.id!)
        .toArray();
      const debits = await db.transactions
        .where('accountId').equals(acc.id!)
        .and(t => t.transactionTypeId === expenseType.id!)
        .toArray();
      const totalCredit = credits.reduce((s, t) => s + t.amount, 0);
      const totalDebit = debits.reduce((s, t) => s + t.amount, 0);
      await db.accounts.update(acc.id!, {
        currentBalance: acc.openingBalance + totalCredit - totalDebit,
      });
    }
  });
}
