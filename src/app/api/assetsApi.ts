import { baseApi } from './baseApi';
import db from '@core/database/db';
import type { Asset, AssetType, AssetValuation, AssetWithType } from '@core/database/types';

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<AssetWithType[], void>({
      queryFn: async () => {
        try {
          const assets = await db.assets.filter((a) => a.isActive !== false).toArray();
          const assetTypes = await db.assetTypes.toArray();
          const typeMap = new Map(assetTypes.map((t) => [t.id!, t]));
          const data: AssetWithType[] = assets.map((a) => ({
            ...a,
            assetType: typeMap.get(a.assetTypeId),
          }));
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Asset'],
    }),

    getAllAssets: builder.query<Asset[], void>({
      queryFn: async () => {
        try {
          return { data: await db.assets.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Asset'],
    }),

    getAssetValuations: builder.query<AssetValuation[], number>({
      queryFn: async (assetId) => {
        try {
          const data = await db.assetValuations
            .where('assetId')
            .equals(assetId)
            .sortBy('valuationDate');
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Asset', id }],
    }),

    createAsset: builder.mutation<number, Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.assets.add({ ...data, createdAt: ts, updatedAt: ts });
          if (data.purchaseDate) {
            await db.assetValuations.add({
              assetId: id as number,
              valuationDate: data.purchaseDate,
              value: data.purchaseValue,
              notes: 'Purchase value',
              createdAt: ts,
              updatedAt: ts,
            });
          }
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Asset'],
    }),

    updateAsset: builder.mutation<void, { id: number; data: Partial<Asset> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.assets.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Asset'],
    }),

    deleteAsset: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.assetValuations.where('assetId').equals(id).delete();
          await db.assets.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Asset'],
    }),

    addAssetValuation: builder.mutation<
      number,
      Omit<AssetValuation, 'id' | 'createdAt' | 'updatedAt'>
    >({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.assetValuations.add({ ...data, createdAt: ts, updatedAt: ts });
          await db.assets.update(data.assetId, { currentValue: data.value, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Asset'],
    }),

    getAssetTypes: builder.query<AssetType[], void>({
      queryFn: async () => {
        try {
          return { data: await db.assetTypes.filter((t) => t.isActive !== false).toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['AssetType'],
    }),

    getAllAssetTypes: builder.query<AssetType[], void>({
      queryFn: async () => {
        try {
          return { data: await db.assetTypes.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['AssetType'],
    }),

    createAssetType: builder.mutation<number, Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.assetTypes.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['AssetType'],
    }),

    updateAssetType: builder.mutation<void, { id: number; data: Partial<AssetType> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.assetTypes.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['AssetType'],
    }),

    deleteAssetType: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.assetTypes.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['AssetType'],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useGetAllAssetsQuery,
  useGetAssetValuationsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useAddAssetValuationMutation,
  useGetAssetTypesQuery,
  useGetAllAssetTypesQuery,
  useCreateAssetTypeMutation,
  useUpdateAssetTypeMutation,
  useDeleteAssetTypeMutation,
} = assetsApi;
