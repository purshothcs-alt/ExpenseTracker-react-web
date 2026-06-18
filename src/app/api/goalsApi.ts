import { baseApi } from './baseApi';
import db from '@core/database/db';
import type { Goal, GoalType, GoalContribution, GoalWithType } from '@core/database/types';

export const goalsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getGoals: builder.query<GoalWithType[], void>({
      queryFn: async () => {
        try {
          const goals = await db.goals.filter(g => g.isActive !== false).toArray();
          const goalTypes = await db.goalTypes.toArray();
          const typeMap = new Map(goalTypes.map(t => [t.id!, t]));
          const data: GoalWithType[] = await Promise.all(
            goals.map(async g => {
              const contributions = await db.goalContributions.where('goalId').equals(g.id!).toArray();
              return { ...g, goalType: typeMap.get(g.goalTypeId), contributions };
            }),
          );
          return { data };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['Goal'],
    }),

    getAllGoals: builder.query<Goal[], void>({
      queryFn: async () => {
        try { return { data: await db.goals.toArray() }; }
        catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['Goal'],
    }),

    createGoal: builder.mutation<number, Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.goals.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['Goal'],
    }),

    updateGoal: builder.mutation<void, { id: number; data: Partial<Goal> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.goals.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['Goal'],
    }),

    deleteGoal: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.goals.delete(id);
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['Goal'],
    }),

    addGoalContribution: builder.mutation<number, Omit<GoalContribution, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.goalContributions.add({ ...data, createdAt: ts, updatedAt: ts });
          const goal = await db.goals.get(data.goalId);
          if (goal) {
            await db.goals.update(data.goalId, {
              currentAmount: goal.currentAmount + data.amount,
              updatedAt: ts,
            });
          }
          return { data: id as number };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['Goal'],
    }),

    getGoalTypes: builder.query<GoalType[], void>({
      queryFn: async () => {
        try { return { data: await db.goalTypes.filter(t => t.isActive !== false).toArray() }; }
        catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['GoalType'],
    }),

    getAllGoalTypes: builder.query<GoalType[], void>({
      queryFn: async () => {
        try { return { data: await db.goalTypes.toArray() }; }
        catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      providesTags: ['GoalType'],
    }),

    createGoalType: builder.mutation<number, Omit<GoalType, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (data) => {
        try {
          const ts = new Date().toISOString();
          const id = await db.goalTypes.add({ ...data, createdAt: ts, updatedAt: ts });
          return { data: id as number };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['GoalType'],
    }),

    updateGoalType: builder.mutation<void, { id: number; data: Partial<GoalType> }>({
      queryFn: async ({ id, data }) => {
        try {
          await db.goalTypes.update(id, { ...data, updatedAt: new Date().toISOString() });
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['GoalType'],
    }),

    deleteGoalType: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await db.goalTypes.delete(id);
          return { data: undefined };
        } catch (e) { return { error: { status: 'CUSTOM_ERROR', error: String(e) } }; }
      },
      invalidatesTags: ['GoalType'],
    }),
  }),
});

export const {
  useGetGoalsQuery, useGetAllGoalsQuery,
  useCreateGoalMutation, useUpdateGoalMutation, useDeleteGoalMutation,
  useAddGoalContributionMutation,
  useGetGoalTypesQuery, useGetAllGoalTypesQuery,
  useCreateGoalTypeMutation, useUpdateGoalTypeMutation, useDeleteGoalTypeMutation,
} = goalsApi;
