import db from '../db';
import { BaseRepository } from './BaseRepository';
import type {
  AccountType,
  Account,
  TransactionType,
  Category,
  Tag,
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
  BudgetType,
  Budget,
  BudgetPeriodRecord,
  IncomeType,
  RecurringTransaction,
} from '../types';
export { TransactionRepository, transactionRepository } from './TransactionRepository';

export const accountTypeRepo = new BaseRepository<AccountType>(db.accountTypes as never);
export const accountRepo = new BaseRepository<Account>(db.accounts as never);
export const transactionTypeRepo = new BaseRepository<TransactionType>(
  db.transactionTypes as never,
);
export const categoryRepo = new BaseRepository<Category>(db.categories as never);
export const tagRepo = new BaseRepository<Tag>(db.tags as never);
export const goalTypeRepo = new BaseRepository<GoalType>(db.goalTypes as never);
export const goalRepo = new BaseRepository<Goal>(db.goals as never);
export const goalContributionRepo = new BaseRepository<GoalContribution>(
  db.goalContributions as never,
);
export const loanTypeRepo = new BaseRepository<LoanType>(db.loanTypes as never);
export const loanRepo = new BaseRepository<Loan>(db.loans as never);
export const loanRepaymentRepo = new BaseRepository<LoanRepayment>(db.loanRepayments as never);
export const assetTypeRepo = new BaseRepository<AssetType>(db.assetTypes as never);
export const assetRepo = new BaseRepository<Asset>(db.assets as never);
export const assetValuationRepo = new BaseRepository<AssetValuation>(db.assetValuations as never);
export const projectRepo = new BaseRepository<Project>(db.projects as never);
export const projectExpenseRepo = new BaseRepository<ProjectExpense>(db.projectExpenses as never);
export const dynamicFieldDefRepo = new BaseRepository<DynamicFieldDefinition>(
  db.dynamicFieldDefinitions as never,
);
export const dynamicFieldValueRepo = new BaseRepository<DynamicFieldValue>(
  db.dynamicFieldValues as never,
);
export const dashboardWidgetRepo = new BaseRepository<DashboardWidget>(
  db.dashboardWidgets as never,
);
export const userDashboardConfigRepo = new BaseRepository<UserDashboardConfig>(
  db.userDashboardConfig as never,
);
export const reportTemplateRepo = new BaseRepository<ReportTemplate>(db.reportTemplates as never);
export const budgetTypeRepo = new BaseRepository<BudgetType>(db.budgetTypes as never);
export const budgetRepo = new BaseRepository<Budget>(db.budgets as never);
export const budgetPeriodRepo = new BaseRepository<BudgetPeriodRecord>(db.budgetPeriods as never);
export const incomeTypeRepo = new BaseRepository<IncomeType>(db.incomeTypes as never);
export const recurringTransactionRepo = new BaseRepository<RecurringTransaction>(
  db.recurringTransactions as never,
);
