export type CategoryType = 'income' | 'expense' | 'both' | 'transfer';
export type TransactionDirection = 'debit' | 'credit' | 'transfer';
export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly';
export type DynamicFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'rating'
  | 'url'
  | 'email'
  | 'phone'
  | 'checkbox'
  | 'radio'
  | 'file';
export type EntityType = 'transaction' | 'account' | 'goal' | 'asset' | 'project';
export type AuditAction = 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type ThemeMode = 'light' | 'dark' | 'system';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type LoanDirection = 'borrowed' | 'lent';

export interface BaseEntity {
  id?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface AccountType extends BaseEntity {
  name: string;
  description?: string;
  icon: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Account extends BaseEntity {
  name: string;
  accountTypeId: number;
  openingBalance: number;
  currentBalance: number;
  description?: string;
  currency: string;
  isActive: boolean;
}

export interface TransactionType extends BaseEntity {
  name: string;
  description?: string;
  icon: string;
  color: string;
  direction: TransactionDirection;
  isActive: boolean;
  displayOrder: number;
  requiresToAccount: boolean;
}

export interface Category extends BaseEntity {
  parentId?: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  categoryType: CategoryType;
  displayOrder: number;
  isActive: boolean;
}

export interface Tag extends BaseEntity {
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
}

export interface Transaction extends BaseEntity {
  transactionDate: string;
  accountId: number;
  toAccountId?: number;
  transactionTypeId: number;
  categoryId?: number;
  subCategoryId?: number;
  amount: number;
  notes?: string;
  attachmentPath?: string;
  isRecurring: boolean;
  recurringId?: number;
  projectId?: number;
  referenceNumber?: string;
  vendor?: string;
}

export interface TransactionTag {
  id?: number;
  transactionId: number;
  tagId: number;
}

export interface RecurringTransaction extends BaseEntity {
  accountId: number;
  toAccountId?: number;
  transactionTypeId: number;
  categoryId?: number;
  subCategoryId?: number;
  amount: number;
  notes?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  lastGeneratedDate?: string;
  nextDueDate?: string;
  isActive: boolean;
  description: string;
}

export interface BudgetType extends BaseEntity {
  name: string;
  description?: string;
  period: BudgetPeriod;
  isActive: boolean;
  displayOrder: number;
}

export interface Budget extends BaseEntity {
  name: string;
  budgetTypeId?: number;
  categoryId?: number;
  accountId?: number;
  projectId?: number;
  amount: number;
  startDate: string;
  endDate: string;
  period: BudgetPeriod;
  alertThreshold: number;
  isActive: boolean;
}

export interface BudgetPeriodRecord extends BaseEntity {
  budgetId: number;
  periodStart: string;
  periodEnd: string;
  budgetAmount: number;
  actualAmount: number;
}

export interface GoalType extends BaseEntity {
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

export interface Goal extends BaseEntity {
  goalName: string;
  goalTypeId: number;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
}

export interface GoalContribution extends BaseEntity {
  goalId: number;
  transactionId?: number;
  amount: number;
  notes?: string;
  contributionDate: string;
}

export interface LoanType extends BaseEntity {
  name: string;
  description?: string;
  direction: LoanDirection;
  isActive: boolean;
  displayOrder: number;
}

export interface Loan extends BaseEntity {
  lenderBorrower: string;
  loanTypeId: number;
  direction: LoanDirection;
  principal: number;
  interestRate?: number;
  startDate: string;
  dueDate?: string;
  notes?: string;
  isSettled: boolean;
  settledDate?: string;
}

export interface LoanRepayment extends BaseEntity {
  loanId: number;
  amount: number;
  paymentDate: string;
  notes?: string;
  transactionId?: number;
}

export interface AssetType extends BaseEntity {
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

export interface Asset extends BaseEntity {
  name: string;
  assetTypeId: number;
  purchaseValue: number;
  currentValue: number;
  purchaseDate?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  isActive: boolean;
}

export interface AssetValuation extends BaseEntity {
  assetId: number;
  valuationDate: string;
  value: number;
  notes?: string;
}

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  totalBudget: number;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  categoryId?: number;
  isActive: boolean;
  color?: string;
  icon?: string;
}

export interface ProjectExpense extends BaseEntity {
  projectId: number;
  categoryId?: number;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  notes?: string;
  transactionId?: number;
}

export type DynamicField = DynamicFieldDefinition;

export interface DynamicFieldDefinition extends BaseEntity {
  entityType: EntityType;
  fieldName: string;
  fieldLabel: string;
  fieldType: DynamicFieldType;
  options?: string;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  defaultValue?: string;
  validationRules?: string;
  helpText?: string;
  placeholder?: string;
}

export interface DynamicFieldValue {
  id?: number;
  entityType: EntityType;
  entityId: number;
  fieldDefinitionId: number;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget extends BaseEntity {
  name: string;
  description?: string;
  componentKey: string;
  defaultConfig: string;
  isActive: boolean;
  category: string;
  icon: string;
  minWidth: number;
  minHeight: number;
}

export interface UserDashboardConfig extends BaseEntity {
  widgetId: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  config: string;
  isVisible: boolean;
  displayOrder: number;
}

export interface ReportTemplate extends BaseEntity {
  name: string;
  description?: string;
  reportType: string;
  config: string;
  filters: string;
  isDefault: boolean;
}

export interface AuditLog {
  id?: number;
  entityType: string;
  entityId: number;
  action: AuditAction;
  oldValue?: string;
  newValue?: string;
  createdBy?: string;
  createdAt: string;
}

export interface IncomeType extends BaseEntity {
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

export interface TransactionWithDetails extends Transaction {
  account?: Account;
  toAccount?: Account;
  transactionType?: TransactionType;
  category?: Category;
  subCategory?: Category;
  tags?: Tag[];
  project?: Project;
}

export interface AccountWithType extends Account {
  accountType?: AccountType;
}

export interface BudgetWithDetails extends Budget {
  category?: Category;
  account?: Account;
  project?: Project;
  budgetType?: BudgetType;
  spent?: number;
  remaining?: number;
  utilizationPct?: number;
}

export interface LoanWithDetails extends Loan {
  loanType?: LoanType;
  totalPaid?: number;
  outstanding?: number;
  repayments?: LoanRepayment[];
}

export interface AssetWithType extends Asset {
  assetType?: AssetType;
}

export interface GoalWithType extends Goal {
  goalType?: GoalType;
  contributions?: GoalContribution[];
}

export interface ProjectWithDetails extends Project {
  category?: Category;
  expenses?: ProjectExpense[];
  totalSpent?: number;
  budgetVariance?: number;
  budgetUtilizationPct?: number;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  cashFlow: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  accountId?: number;
  transactionTypeId?: number;
  categoryId?: number;
  tagIds?: number[];
  projectId?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AppSettings {
  appName: string;
  currency: string;
  currencySymbol: string;
  themeMode: ThemeMode;
  dateFormat: string;
  timeFormat?: string;
  language: string;
  weekStartDay: number;
  decimalSeparator: string;
  thousandSeparator: string;
  decimalPlaces: number;
  showCents: boolean;
  compactMode: boolean;
  enableBudgetAlerts: boolean;
  enableGoalReminders: boolean;
  enableLoanDueAlerts: boolean;
  autoBackup: boolean;
  defaultAccountId?: number;
}
