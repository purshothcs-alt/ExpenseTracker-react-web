import { baseApi } from './baseApi';
import db from '@core/database/db';
import {
  pendingSmsTransactionRepository,
  merchantCategoryMappingRepo,
} from '@core/database/repositories';
import { importSmsText as runSmsImportPipeline } from '@core/sms/pipeline';
import type { ImportSmsResult } from '@core/sms/pipeline';
import type {
  PendingSmsTransaction,
  PendingSmsTransactionWithDetails,
  SmsTransactionStatus,
  Transaction,
  MerchantCategoryMapping,
} from '@core/database/types';

/**
 * Reads the SMS import toggles straight from the settings table rather than
 * through Redux, so the (framework-agnostic) sms pipeline stays decoupled
 * from the store — this file is the only bridge between the two.
 */
async function getSmsImportSettings(): Promise<{
  smsImportEnabled: boolean;
  smsAutoApproveEnabled: boolean;
}> {
  const rows = await db.settings.bulkGet(['smsImportEnabled', 'smsAutoApproveEnabled']);
  return {
    smsImportEnabled: rows[0]?.value !== 'false',
    smsAutoApproveEnabled: rows[1]?.value === 'true',
  };
}

export const smsImportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPendingSmsTransactions: builder.query<
      PendingSmsTransactionWithDetails[],
      SmsTransactionStatus | void
    >({
      queryFn: async (status) => {
        try {
          return { data: await pendingSmsTransactionRepository.list(status ?? undefined) };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['PendingSmsTransaction'],
    }),

    getPendingSmsCount: builder.query<number, void>({
      queryFn: async () => {
        try {
          const rows = await pendingSmsTransactionRepository.list('pending');
          return { data: rows.length };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['PendingSmsTransaction'],
    }),

    importSmsText: builder.mutation<
      ImportSmsResult,
      { sender: string; body: string; timestamp: string }
    >({
      queryFn: async ({ sender, body, timestamp }) => {
        try {
          const settings = await getSmsImportSettings();
          const data = await runSmsImportPipeline(sender, body, timestamp, settings);
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: [
        'PendingSmsTransaction',
        'Transaction',
        'Account',
        'Project',
        'ProjectExpense',
      ],
    }),

    updatePendingSmsTransaction: builder.mutation<
      void,
      { id: number; data: Partial<PendingSmsTransaction> }
    >({
      queryFn: async ({ id, data }) => {
        try {
          await pendingSmsTransactionRepository.update(id, data);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['PendingSmsTransaction'],
    }),

    approveSmsTransaction: builder.mutation<
      number,
      { id: number; data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>; tagIds?: number[] }
    >({
      queryFn: async ({ id, data, tagIds }) => {
        try {
          const transactionId = await pendingSmsTransactionRepository.approve(id, data, tagIds);
          return { data: transactionId };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: [
        'PendingSmsTransaction',
        'Transaction',
        'Account',
        'Project',
        'ProjectExpense',
      ],
    }),

    ignoreSmsTransaction: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await pendingSmsTransactionRepository.ignore(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['PendingSmsTransaction'],
    }),

    clearSmsImportHistory: builder.mutation<number, void>({
      queryFn: async () => {
        try {
          return { data: await pendingSmsTransactionRepository.clearResolvedHistory() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['PendingSmsTransaction'],
    }),

    getMerchantCategoryMappings: builder.query<MerchantCategoryMapping[], void>({
      queryFn: async () => {
        try {
          return { data: await merchantCategoryMappingRepo.getAll() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['MerchantCategoryMapping'],
    }),

    createMerchantCategoryMapping: builder.mutation<
      number,
      Omit<MerchantCategoryMapping, 'id' | 'createdAt' | 'updatedAt'>
    >({
      queryFn: async (data) => {
        try {
          return { data: await merchantCategoryMappingRepo.create(data) };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['MerchantCategoryMapping'],
    }),

    updateMerchantCategoryMapping: builder.mutation<
      void,
      { id: number; data: Partial<MerchantCategoryMapping> }
    >({
      queryFn: async ({ id, data }) => {
        try {
          await merchantCategoryMappingRepo.update(id, data);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['MerchantCategoryMapping'],
    }),

    deleteMerchantCategoryMapping: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await merchantCategoryMappingRepo.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['MerchantCategoryMapping'],
    }),
  }),
});

export const {
  useGetPendingSmsTransactionsQuery,
  useGetPendingSmsCountQuery,
  useImportSmsTextMutation,
  useUpdatePendingSmsTransactionMutation,
  useApproveSmsTransactionMutation,
  useIgnoreSmsTransactionMutation,
  useClearSmsImportHistoryMutation,
  useGetMerchantCategoryMappingsQuery,
  useCreateMerchantCategoryMappingMutation,
  useUpdateMerchantCategoryMappingMutation,
  useDeleteMerchantCategoryMappingMutation,
} = smsImportApi;
