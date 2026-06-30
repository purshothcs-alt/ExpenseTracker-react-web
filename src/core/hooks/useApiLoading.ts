import { useAppSelector } from '@app/hooks';
import { baseApi } from '@app/api/baseApi';

export function useApiLoading(): boolean {
  return useAppSelector((state) => {
    const apiState = state[baseApi.reducerPath];
    const queries = Object.values(apiState.queries) as { status?: string }[];
    const mutations = Object.values(apiState.mutations) as { status?: string }[];
    return (
      queries.some((q) => q?.status === 'pending') || mutations.some((m) => m?.status === 'pending')
    );
  });
}
