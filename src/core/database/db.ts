import Dexie, { type Table } from 'dexie';
import type {
  Setting,
  AccountType,
  Account,
  TransactionType,
  Category,
  Tag,
  Transaction,
  TransactionTag,
  RecurringTransaction,
  BudgetType,
  Budget,
  BudgetPeriodRecord,
  GoalType,
  Goal,
  GoalContribution,
  LoanType,
  Loan,
  LoanRepayment,
  AssetType,
  Asset,
  AssetValuation,
  Project,
  ProjectExpense,
  DynamicFieldDefinition,
  DynamicFieldValue,
  DashboardWidget,
  UserDashboardConfig,
  ReportTemplate,
  AuditLog,
  IncomeType,
} from './types';

export class ExpenseTrackerDB extends Dexie {
  settings!: Table<Setting, string>;
  accountTypes!: Table<AccountType, number>;
  accounts!: Table<Account, number>;
  transactionTypes!: Table<TransactionType, number>;
  categories!: Table<Category, number>;
  tags!: Table<Tag, number>;
  transactions!: Table<Transaction, number>;
  transactionTags!: Table<TransactionTag, number>;
  recurringTransactions!: Table<RecurringTransaction, number>;
  budgetTypes!: Table<BudgetType, number>;
  budgets!: Table<Budget, number>;
  budgetPeriods!: Table<BudgetPeriodRecord, number>;
  goalTypes!: Table<GoalType, number>;
  goals!: Table<Goal, number>;
  goalContributions!: Table<GoalContribution, number>;
  loanTypes!: Table<LoanType, number>;
  loans!: Table<Loan, number>;
  loanRepayments!: Table<LoanRepayment, number>;
  assetTypes!: Table<AssetType, number>;
  assets!: Table<Asset, number>;
  assetValuations!: Table<AssetValuation, number>;
  projects!: Table<Project, number>;
  projectExpenses!: Table<ProjectExpense, number>;
  dynamicFieldDefinitions!: Table<DynamicFieldDefinition, number>;
  dynamicFieldValues!: Table<DynamicFieldValue, number>;
  dashboardWidgets!: Table<DashboardWidget, number>;
  userDashboardConfig!: Table<UserDashboardConfig, number>;
  reportTemplates!: Table<ReportTemplate, number>;
  auditLogs!: Table<AuditLog, number>;
  incomeTypes!: Table<IncomeType, number>;

  constructor() {
    super('ExpenseTrackerProDB');

    this.version(1).stores({
      settings: '&key',
      accountTypes: '++id, name, isActive',
      accounts: '++id, name, accountTypeId, isActive',
      transactionTypes: '++id, name, isActive, direction',
      categories: '++id, parentId, name, categoryType, isActive',
      tags: '++id, name, isActive',
      transactions:
        '++id, transactionDate, accountId, toAccountId, transactionTypeId, categoryId, subCategoryId, projectId, isRecurring',
      transactionTags: '++id, transactionId, tagId',
      recurringTransactions: '++id, accountId, isActive',
      budgetTypes: '++id, name, isActive',
      budgets: '++id, categoryId, accountId, projectId, isActive',
      budgetPeriods: '++id, budgetId, periodStart, periodEnd',
      goalTypes: '++id, name, isActive',
      goals: '++id, goalTypeId, isActive',
      goalContributions: '++id, goalId, contributionDate',
      loanTypes: '++id, name, isActive',
      loans: '++id, lenderBorrower, loanTypeId, isSettled, direction',
      loanRepayments: '++id, loanId, paymentDate',
      assetTypes: '++id, name, isActive',
      assets: '++id, assetTypeId, isActive',
      assetValuations: '++id, assetId, valuationDate',
      projects: '++id, status, isActive',
      projectExpenses: '++id, projectId, categoryId, expenseDate',
      dynamicFieldDefinitions: '++id, entityType, fieldName, isActive',
      dynamicFieldValues: '++id, entityType, entityId, fieldDefinitionId',
      dashboardWidgets: '++id, componentKey, isActive',
      userDashboardConfig: '++id, widgetId, displayOrder',
      reportTemplates: '++id, reportType, isDefault',
      auditLogs: '++id, entityType, entityId, createdAt',
      incomeTypes: '++id, name, isActive',
    });
  }
}

export const db = new ExpenseTrackerDB();

export default db;
