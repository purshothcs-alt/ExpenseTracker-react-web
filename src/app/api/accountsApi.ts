import { baseApi } from './baseApi';
import db from '@core/database/db';
import type { Account, AccountType, AccountWithType } from '@core/database/types';

export const accountsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getAccounts: builder.query<AccountWithType[], void>({
      queryFn: async () => {
        try {
          const accounts = await db.accounts.filter(a => a.isActive !== false).toArray();
          const accountTypes = await db.accountTypes.toArray();
          const typeMap = new Map(accountTypes.map(t => [t.id!, t]));
          const data: AccountWithType[] = accounts.map(a => ({ ...a, accountType: typeMap.get(a.accountTypeId) }));
          return { data };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['Account'],
    }),

    getAllAccounts: builder.query<AccountWithType[], void>({
      queryFn: async () => {
        try {
          const accounts = await db.accounts.toArray();
          const accountTypes = await db.accountTypes.toArray();
          const typeMap = new Map(accountTypes.map(t => [t.id!, t]));
          const data: AccountWithType[] = accounts.map(a => ({ ...a, accountType: typeMap.get(a.accountTypeId) }));
          return { data };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['Account'],
    }),

    getAccountById: builder.query<AccountWithType | undefined, number>({
      queryFn: async (id) => {
        try {
          const account = await db.accounts.get(id);
          if (!account) return { data: undefined };
          const accountType = await db.accountTypes.get(account.accountTypeId);
          return { data: { ...account, accountType } };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: (_r, _e, id) => [{ type: 'Account', id }],
    }),

    createAccount: builder.mutation<number, Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.accounts.add({ ...data, currentBalance: data.openingBalance, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['Account'],
    }),

    updateAccount: builder.mutation<void, { id: number; data: Partial<Account> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.accounts.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Account', id }, 'Account'],
    }),

    deleteAccount: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.accounts.delete(id);
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['Account'],
    }),

    getAccountTypes: builder.query<AccountType[], void>({
      queryFn: async () => {
        try {
          const data = await db.accountTypes.filter(t => t.isActive !== false).toArray();
          return { data };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['AccountType'],
    }),

    getAllAccountTypes: builder.query<AccountType[], void>({
      queryFn: async () => {
        try { return { data: await db.accountTypes.toArray() }; }
        catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['AccountType'],
    }),

    createAccountType: builder.mutation<number, Omit<AccountType, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.accountTypes.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['AccountType'],
    }),

    updateAccountType: builder.mutation<void, { id: number; data: Partial<AccountType> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.accountTypes.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['AccountType'],
    }),

    deleteAccountType: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.accountTypes.delete(id);
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['AccountType'],
    }),
  }),
});

export const {
  useGetAccountsQuery, useGetAllAccountsQuery, useGetAccountByIdQuery,
  useCreateAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation,
  useGetAccountTypesQuery, useGetAllAccountTypesQuery,
  useCreateAccountTypeMutation, useUpdateAccountTypeMutation, useDeleteAccountTypeMutation,
} = accountsApi;
