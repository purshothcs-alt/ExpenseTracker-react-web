import { baseApi } from './baseApi';
import db from '@core/database/db';
import dayjs from 'dayjs';
import type { DashboardWidget, UserDashboardConfig, DashboardSummary } from '@core/database/types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      queryFn: async () => {
        try {
          const [accounts, assets, loans, txTypes] = await Promise.all([
            db.accounts.filter(a => a.isActive !== false).toArray(),
            db.assets.filter(a => a.isActive !== false).toArray(),
            db.loans.filter(l => !l.isSettled).toArray(),
            db.transactionTypes.toArray(),
          ]);

          const creditTypes = new Set(txTypes.filter(t => t.direction === 'credit').map(t => t.id!));
          const debitTypes = new Set(txTypes.filter(t => t.direction === 'debit').map(t => t.id!));

          const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
          const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);
          const totalLiabilities = loans.reduce((s, l) => s + l.principal, 0);
          const netWorth = totalAssets - totalLiabilities;

          const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
          const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

          const monthlyTxs = await db.transactions
            .filter(t => t.transactionDate >= monthStart && t.transactionDate <= monthEnd)
            .toArray();

          const monthlyIncome = monthlyTxs.filter(t => creditTypes.has(t.transactionTypeId)).reduce((s, t) => s + t.amount, 0);
          const monthlyExpense = monthlyTxs.filter(t => debitTypes.has(t.transactionTypeId)).reduce((s, t) => s + t.amount, 0);
          const cashFlow = monthlyIncome - monthlyExpense;

          return { data: { totalBalance, monthlyIncome, monthlyExpense, cashFlow, netWorth, totalAssets, totalLiabilities } };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['Transaction', 'Account', 'Asset', 'Loan'],
    }),

    getDashboardWidgets: builder.query<DashboardWidget[], void>({
      queryFn: async () => {
        try { return { data: await db.dashboardWidgets.filter(w => w.isActive !== false).toArray() }; }
        catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['DashboardWidget'],
    }),

    getAllDashboardWidgets: builder.query<DashboardWidget[], void>({
      queryFn: async () => {
        try { return { data: await db.dashboardWidgets.toArray() }; }
        catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['DashboardWidget'],
    }),

    getUserDashboardConfig: builder.query<(UserDashboardConfig & { widget?: DashboardWidget })[], void>({
      queryFn: async () => {
        try {
          const configs = await db.userDashboardConfig.orderBy('displayOrder').toArray();
          const widgets = await db.dashboardWidgets.toArray();
          const widgetMap = new Map(widgets.map(w => [w.id!, w]));
          const data = configs
            .filter(c => c.isVisible !== false)
            .map(c => ({ ...c, widget: widgetMap.get(c.widgetId) }));
          return { data };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['DashboardConfig'],
    }),

    updateDashboardConfig: builder.mutation<void, Partial<UserDashboardConfig> & { id: number }>({
      queryFn: async ({ id, ...data }) => {
        try {
          await db.userDashboardConfig.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['DashboardConfig'],
    }),

    saveDashboardLayout: builder.mutation<void, Array<{ id: number; positionX: number; positionY: number; width: number; height: number; displayOrder: number }>>({
      queryFn: async (layout) => {
        try {
          const ts = new Date().toISOString();
          await Promise.all(layout.map(item => db.userDashboardConfig.update(item.id, { ...item, updatedAt: ts })));
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['DashboardConfig'],
    }),

    addWidgetToDashboard: builder.mutation<void, { widgetId: number; config?: string }>({
      queryFn: async ({ widgetId, config }) => {
        try {
          const widget = await db.dashboardWidgets.get(widgetId);
          const count = await db.userDashboardConfig.count();
          const ts = new Date().toISOString();
          await db.userDashboardConfig.add({
            widgetId,
            positionX: 0,
            positionY: count,
            width: widget?.minWidth || 1,
            height: widget?.minHeight || 1,
            config: config || widget?.defaultConfig || '{}',
            isVisible: true,
            displayOrder: count + 1,
            createdAt: ts,
            updatedAt: ts,
          });
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['DashboardConfig'],
    }),

    removeWidgetFromDashboard: builder.mutation<void, number>({
      queryFn: async (configId) => {
        try {
          await db.userDashboardConfig.delete(configId);
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['DashboardConfig'],
    }),

    createDashboardWidget: builder.mutation<number, Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.dashboardWidgets.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['DashboardWidget'],
    }),

    updateDashboardWidget: builder.mutation<void, { id: number; data: Partial<DashboardWidget> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.dashboardWidgets.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['DashboardWidget'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery, useGetDashboardWidgetsQuery, useGetAllDashboardWidgetsQuery,
  useGetUserDashboardConfigQuery, useUpdateDashboardConfigMutation,
  useSaveDashboardLayoutMutation, useAddWidgetToDashboardMutation, useRemoveWidgetFromDashboardMutation,
  useCreateDashboardWidgetMutation, useUpdateDashboardWidgetMutation,
} = dashboardApi;
