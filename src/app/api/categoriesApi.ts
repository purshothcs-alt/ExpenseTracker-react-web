import { baseApi } from './baseApi';
import db from '@core/database/db';
import type { Category, Tag } from '@core/database/types';

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      queryFn: async () => {
        try {
          return { data: await db.categories.filter((c) => c.isActive !== false).toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Category'],
    }),

    getAllCategories: builder.query<Category[], void>({
      queryFn: async () => {
        try {
          return { data: await db.categories.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Category'],
    }),

    createCategory: builder.mutation<number, Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.categories.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Category'],
    }),

    updateCategory: builder.mutation<void, { id: number; data: Partial<Category> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.categories.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Category'],
    }),

    deleteCategory: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.categories.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Category'],
    }),

    getTags: builder.query<Tag[], void>({
      queryFn: async () => {
        try {
          return { data: await db.tags.filter((t) => t.isActive !== false).toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Tag'],
    }),

    getAllTags: builder.query<Tag[], void>({
      queryFn: async () => {
        try {
          return { data: await db.tags.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Tag'],
    }),

    createTag: builder.mutation<number, Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.tags.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Tag'],
    }),

    updateTag: builder.mutation<void, { id: number; data: Partial<Tag> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.tags.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Tag'],
    }),

    deleteTag: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.tags.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Tag'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetTagsQuery,
  useGetAllTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = categoriesApi;
