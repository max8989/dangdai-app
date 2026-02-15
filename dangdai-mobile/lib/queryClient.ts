/**
 * TanStack Query Client Configuration
 *
 * This module provides the QueryClient configuration for TanStack Query.
 * Will be fully implemented in Story 1-5 (Configure State Management).
 */

// Placeholder for QueryClient configuration
// Will be implemented when @tanstack/react-query is installed in Story 1-5

/**
 * Default query client options
 *
 * These options will be applied to all queries unless overridden.
 */
export const defaultQueryOptions = {
  queries: {
    // Time data is considered fresh (won't refetch)
    staleTime: 1000 * 60 * 5, // 5 minutes

    // Time data stays in cache after becoming inactive
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

    // Retry configuration
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch configuration
    refetchOnWindowFocus: false, // Mobile apps don't have window focus
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry configuration for mutations
    retry: 1,
  },
} as const;

/**
 * Create and export QueryClient
 * TODO: Implement in Story 1-5 when @tanstack/react-query is installed
 *
 * Usage (after Story 1-5):
 * ```tsx
 * import { QueryClientProvider } from '@tanstack/react-query';
 * import { queryClient } from '@/lib/queryClient';
 *
 * export default function RootLayout() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       {children}
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
// export const queryClient = new QueryClient({
//   defaultOptions: defaultQueryOptions,
// });
