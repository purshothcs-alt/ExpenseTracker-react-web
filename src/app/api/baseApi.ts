import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    'Account', 'AccountType', 'Transaction', 'TransactionType', 'Category',
    'Tag', 'Budget', 'BudgetType', 'Goal', 'GoalType', 'Loan', 'LoanType',
    'Asset', 'AssetType', 'Project', 'ProjectExpense', 'RecurringTransaction',
    'DashboardWidget', 'DashboardConfig', 'ReportTemplate', 'Settings',
    'DynamicField', 'IncomeType', 'AuditLog',
  ],
  endpoints: () => ({}),
});
