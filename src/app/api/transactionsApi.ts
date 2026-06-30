import { baseApi } from './baseApi';
import { transactionRepository } from '@core/database/repositories';
import db from '@core/database/db';
import type {
  Transaction,
  TransactionFilter,
  PaginatedResult,
  TransactionWithDetails,
  TransactionType,
} from '@core/database/types';

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<PaginatedResult<Transaction>, TransactionFilter>({
      queryFn: async (filter) => {
        try {
          const data = await transactionRepository.getFiltered(filter);
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Transaction'],
    }),

    getTransactionById: builder.query<TransactionWithDetails | undefined, number>({
      queryFn: async (id) => {
        try {
          const data = await transactionRepository.getWithDetails(id);
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Transaction', id }],
    }),

    getRecentTransactions: builder.query<TransactionWithDetails[], number>({
      queryFn: async (limit = 10) => {
        try {
          const txs = await db.transactions
            .orderBy('transactionDate')
            .reverse()
            .limit(limit)
            .toArray();
          const enriched = await Promise.all(
            txs.map((t) => transactionRepository.enrichTransaction(t)),
          );
          return { data: enriched };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Transaction'],
    }),

    getMonthlySummary: builder.query<
      Array<{ month: string; income: number; expense: number }>,
      number
    >({
      queryFn: async (months = 12) => {
        try {
          const data = await transactionRepository.getSummaryByMonth(months);
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Transaction'],
    }),

    getCategoryTotals: builder.query<
      Array<{ categoryId: number; total: number }>,
      { startDate: string; endDate: string }
    >({
      queryFn: async ({ startDate, endDate }) => {
        try {
          const data = await transactionRepository.getCategoryTotals(startDate, endDate);
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Transaction'],
    }),

    createTransaction: builder.mutation<
      number,
      { data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>; tagIds?: number[] }
    >({
      queryFn: async ({ data, tagIds }) => {
        try {
          const id = await transactionRepository.create(data, tagIds);
          return { data: id };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Transaction', 'Account', 'Project', 'ProjectExpense'],
    }),

    updateTransaction: builder.mutation<
      void,
      { id: number; data: Partial<Transaction>; tagIds?: number[] }
    >({
      queryFn: async ({ id, data, tagIds }) => {
        try {
          await transactionRepository.update(id, data, tagIds);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Transaction', 'Account', 'Project', 'ProjectExpense'],
    }),

    deleteTransaction: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await transactionRepository.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Transaction', 'Account', 'Project', 'ProjectExpense'],
    }),

    bulkDeleteTransactions: builder.mutation<void, number[]>({
      queryFn: async (ids) => {
        try {
          await Promise.all(ids.map((id) => transactionRepository.delete(id)));
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Transaction', 'Account', 'Project', 'ProjectExpense'],
    }),

    duplicateTransaction: builder.mutation<number, number>({
      queryFn: async (id) => {
        try {
          const tx = await db.transactions.get(id);
          if (!tx) return { error: { status: 'CUSTOM_ERROR', error: 'Transaction not found' } };
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = tx;
          void _id;
          void _c;
          void _u;
          const newId = await transactionRepository.create({
            ...rest,
            transactionDate: new Date().toISOString().split('T')[0],
          });
          return { data: newId };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Transaction', 'Account', 'Project', 'ProjectExpense'],
    }),

    getTransactionTypes: builder.query<TransactionType[], void>({
      queryFn: async () => {
        try {
          return { data: await db.transactionTypes.filter((t) => t.isActive !== false).toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['TransactionType'],
    }),

    getAllTransactionTypes: builder.query<TransactionType[], void>({
      queryFn: async () => {
        try {
          return { data: await db.transactionTypes.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['TransactionType'],
    }),

    createTransactionType: builder.mutation<
      number,
      Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>
    >({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.transactionTypes.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['TransactionType'],
    }),

    updateTransactionType: builder.mutation<void, { id: number; data: Partial<TransactionType> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.transactionTypes.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['TransactionType'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useGetRecentTransactionsQuery,
  useGetMonthlySummaryQuery,
  useGetCategoryTotalsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useBulkDeleteTransactionsMutation,
  useDuplicateTransactionMutation,
  useGetTransactionTypesQuery,
  useGetAllTransactionTypesQuery,
  useCreateTransactionTypeMutation,
  useUpdateTransactionTypeMutation,
} = transactionsApi;
