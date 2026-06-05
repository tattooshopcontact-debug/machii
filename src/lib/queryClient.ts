import { QueryClient } from '@tanstack/react-query';

/** Cache server-state (trajets, profils) — dédup, refetch, support offline. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
