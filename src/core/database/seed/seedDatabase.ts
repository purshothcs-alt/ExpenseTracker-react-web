import db from '../db';
import {
  seedTransactionTypes, seedCategories, seedSubCategories,
  seedTags, seedGoalTypes, seedLoanTypes, seedAssetTypes, seedBudgetTypes,
  seedIncomeTypes, seedDashboardWidgets, seedReportTemplates,
  seedGoals, seedAssets, seedBudgets,
} from './seedData';
import type { Category } from '../types';

export async function isDatabaseSeeded(): Promise<boolean> {
  const count = await db.categories.count();
  return count > 0;
}

export async function seedDatabase(): Promise<void> {
  const alreadySeeded = await isDatabaseSeeded();
  if (alreadySeeded) return;

  await db.transaction('rw', [
    db.settings, db.transactionTypes,
    db.categories, db.tags, db.goalTypes, db.goals, db.loanTypes,
    db.assetTypes, db.assets, db.budgetTypes, db.budgets,
    db.incomeTypes, db.dashboardWidgets, db.userDashboardConfig,
    db.reportTemplates,
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

    await db.transactionTypes.bulkAdd(seedTransactionTypes);

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

    const goalTypesData = await db.goalTypes.toArray();
    await db.goals.bulkAdd(seedGoals(goalTypesData));

    const assetTypesData = await db.assetTypes.toArray();
    await db.assets.bulkAdd(seedAssets(assetTypesData));

    await db.budgets.bulkAdd(seedBudgets(allCategories));
  });
}
