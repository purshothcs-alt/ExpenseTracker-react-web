import { baseApi } from './baseApi';
import db from '@core/database/db';
import dayjs from 'dayjs';
import type { Budget, BudgetType, BudgetWithDetails } from '@core/database/types';

export const budgetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query<BudgetWithDetails[], void>({
      queryFn: async () => {
        try {
          const budgets = await db.budgets.filter((b) => b.isActive !== false).toArray();
          const [categories, accounts, projects, budgetTypes] = await Promise.all([
            db.categories.toArray(),
            db.accounts.toArray(),
            db.projects.toArray(),
            db.budgetTypes.toArray(),
          ]);
          const catMap = new Map(categories.map((c) => [c.id!, c]));
          const accMap = new Map(accounts.map((a) => [a.id!, a]));
          const projMap = new Map(projects.map((p) => [p.id!, p]));
          const btMap = new Map(budgetTypes.map((t) => [t.id!, t]));

          const today = dayjs().format('YYYY-MM-DD');
          const txTypes = await db.transactionTypes.toArray();
          const debitTypes = new Set(
            txTypes.filter((t) => t.direction === 'debit').map((t) => t.id!),
          );

          const data: BudgetWithDetails[] = await Promise.all(
            budgets.map(async (b) => {
              const txs = await db.transactions
                .filter(
                  (t) =>
                    t.transactionDate >= b.startDate &&
                    t.transactionDate <= (b.endDate > today ? today : b.endDate) &&
                    debitTypes.has(t.transactionTypeId) &&
                    (b.categoryId
                      ? t.categoryId === b.categoryId || t.subCategoryId === b.categoryId
                      : true) &&
                    (b.accountId ? t.accountId === b.accountId : true) &&
                    (b.projectId ? t.projectId === b.projectId : true),
                )
                .toArray();
              const spent = txs.reduce((s, t) => s + t.amount, 0);
              const remaining = b.amount - spent;
              const utilizationPct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
              return {
                ...b,
                category: b.categoryId ? catMap.get(b.categoryId) : undefined,
                account: b.accountId ? accMap.get(b.accountId) : undefined,
                project: b.projectId ? projMap.get(b.projectId) : undefined,
                budgetType: b.budgetTypeId ? btMap.get(b.budgetTypeId) : undefined,
                spent,
                remaining,
                utilizationPct,
              };
            }),
          );
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Budget'],
    }),

    getAllBudgets: builder.query<Budget[], void>({
      queryFn: async () => {
        try {
          return { data: await db.budgets.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Budget'],
    }),

    createBudget: builder.mutation<number, Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.budgets.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Budget'],
    }),

    updateBudget: builder.mutation<void, { id: number; data: Partial<Budget> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.budgets.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Budget'],
    }),

    deleteBudget: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.budgets.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Budget'],
    }),

    getBudgetTypes: builder.query<BudgetType[], void>({
      queryFn: async () => {
        try {
          return { data: await db.budgetTypes.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['BudgetType'],
    }),

    createBudgetType: builder.mutation<number, Omit<BudgetType, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.budgetTypes.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['BudgetType'],
    }),
  }),
});

export const {
  useGetBudgetsQuery,
  useGetAllBudgetsQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
  useGetBudgetTypesQuery,
  useCreateBudgetTypeMutation,
} = budgetsApi;
