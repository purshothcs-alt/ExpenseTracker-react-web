import { baseApi } from './baseApi';
import db from '@core/database/db';
import type { Loan, LoanType, LoanRepayment, LoanWithDetails } from '@core/database/types';

export const loansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query<LoanWithDetails[], void>({
      queryFn: async () => {
        try {
          const loans = await db.loans.toArray();
          const loanTypes = await db.loanTypes.toArray();
          const typeMap = new Map(loanTypes.map((t) => [t.id!, t]));
          const data: LoanWithDetails[] = await Promise.all(
            loans.map(async (l) => {
              const repayments = await db.loanRepayments.where('loanId').equals(l.id!).toArray();
              const totalPaid = repayments.reduce((s, r) => s + r.amount, 0);
              const outstanding = l.principal - totalPaid;
              return {
                ...l,
                loanType: typeMap.get(l.loanTypeId),
                totalPaid,
                outstanding,
                repayments,
              };
            }),
          );
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Loan'],
    }),

    createLoan: builder.mutation<number, Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.loans.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Loan'],
    }),

    updateLoan: builder.mutation<void, { id: number; data: Partial<Loan> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.loans.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Loan'],
    }),

    deleteLoan: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.loanRepayments.where('loanId').equals(id).delete();
          await db.loans.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Loan'],
    }),

    addRepayment: builder.mutation<number, Omit<LoanRepayment, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.loanRepayments.add({ ...data, createdAt: ts, updatedAt: ts });
          const loan = await db.loans.get(data.loanId);
          const repayments = await db.loanRepayments.where('loanId').equals(data.loanId).toArray();
          const totalPaid = repayments.reduce((s, r) => s + r.amount, 0);
          if (loan && totalPaid >= loan.principal) {
            await db.loans.update(data.loanId, { isSettled: true, settledDate: ts, updatedAt: ts });
          }
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Loan'],
    }),

    getLoanTypes: builder.query<LoanType[], void>({
      queryFn: async () => {
        try {
          return { data: await db.loanTypes.filter((t) => t.isActive !== false).toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['LoanType'],
    }),

    getAllLoanTypes: builder.query<LoanType[], void>({
      queryFn: async () => {
        try {
          return { data: await db.loanTypes.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['LoanType'],
    }),

    createLoanType: builder.mutation<number, Omit<LoanType, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.loanTypes.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['LoanType'],
    }),

    updateLoanType: builder.mutation<void, { id: number; data: Partial<LoanType> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.loanTypes.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['LoanType'],
    }),

    deleteLoanType: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.loanTypes.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['LoanType'],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useAddRepaymentMutation,
  useGetLoanTypesQuery,
  useGetAllLoanTypesQuery,
  useCreateLoanTypeMutation,
  useUpdateLoanTypeMutation,
  useDeleteLoanTypeMutation,
} = loansApi;
