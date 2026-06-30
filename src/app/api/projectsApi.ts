import { baseApi } from './baseApi';
import db from '@core/database/db';
import type { Project, ProjectExpense, ProjectWithDetails } from '@core/database/types';

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<ProjectWithDetails[], void>({
      queryFn: async () => {
        try {
          const projects = await db.projects.filter((p) => p.isActive !== false).toArray();
          const categories = await db.categories.toArray();
          const catMap = new Map(categories.map((c) => [c.id!, c]));
          const data: ProjectWithDetails[] = await Promise.all(
            projects.map(async (p) => {
              const expenses = await db.projectExpenses.where('projectId').equals(p.id!).toArray();
              const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
              const budgetVariance = p.totalBudget - totalSpent;
              const budgetUtilizationPct =
                p.totalBudget > 0 ? (totalSpent / p.totalBudget) * 100 : 0;
              return {
                ...p,
                category: p.categoryId ? catMap.get(p.categoryId) : undefined,
                expenses,
                totalSpent,
                budgetVariance,
                budgetUtilizationPct,
              };
            }),
          );
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Project'],
    }),

    getAllProjects: builder.query<Project[], void>({
      queryFn: async () => {
        try {
          return { data: await db.projects.toArray() };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: ['Project'],
    }),

    getProjectExpenses: builder.query<ProjectExpense[], number>({
      queryFn: async (projectId) => {
        try {
          const data = await db.projectExpenses
            .where('projectId')
            .equals(projectId)
            .reverse()
            .sortBy('expenseDate');
          return { data };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Project', id }, 'ProjectExpense'],
    }),

    createProject: builder.mutation<number, Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.projects.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Project'],
    }),

    updateProject: builder.mutation<void, { id: number; data: Partial<Project> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.projects.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Project'],
    }),

    deleteProject: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.projectExpenses.where('projectId').equals(id).delete();
          await db.projects.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Project'],
    }),

    addProjectExpense: builder.mutation<
      number,
      Omit<ProjectExpense, 'id' | 'createdAt' | 'updatedAt'>
    >({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.projectExpenses.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Project', 'ProjectExpense'],
    }),

    updateProjectExpense: builder.mutation<void, { id: number; data: Partial<ProjectExpense> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.projectExpenses.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Project', 'ProjectExpense'],
    }),

    deleteProjectExpense: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.projectExpenses.delete(id);
          return { data: undefined };
        } catch (e) {
          return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
        }
      },
      invalidatesTags: ['Project', 'ProjectExpense'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetAllProjectsQuery,
  useGetProjectExpensesQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddProjectExpenseMutation,
  useUpdateProjectExpenseMutation,
  useDeleteProjectExpenseMutation,
} = projectsApi;
