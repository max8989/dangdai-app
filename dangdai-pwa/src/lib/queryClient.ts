/**
 * TanStack Query Client Configuration
 *
 * This module provides the QueryClient configuration for TanStack Query.
 * Per architecture specification, TanStack Query is used for server state
 * (user profile, progress, quiz history).
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'

/**
 * Global error handler for queries
 * Logs errors and can be extended to show toast notifications
 */
const handleQueryError = (error: Error) => {
  // Log error for debugging
  console.error('[TanStack Query] Query error:', error.message)

  // In the future, this can trigger toast notifications via Zustand or event emitter
  // For now, individual queries can override with their own onError
}

/**
 * Global error handler for mutations
 * Logs errors and can be extended to show toast notifications
 */
const handleMutationError = (error: Error) => {
  // Log error for debugging
  console.error('[TanStack Query] Mutation error:', error.message)

  // In the future, this can trigger toast notifications via Zustand or event emitter
  // For now, individual mutations can override with their own onError
}

/**
 * Create and export QueryClient with optimized defaults
 *
 * Configuration rationale:
 * - staleTime: 5 minutes - balance between freshness and network efficiency
 * - gcTime: 30 minutes - keep data in cache for background refetches
 * - retry: 1 - retry failed requests once (per architecture spec)
 * - refetchOnWindowFocus: true - good for mobile app resume scenarios
 * - Global error handlers for consistent error logging
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,

      // Keep unused data in cache for 30 minutes
      gcTime: 1000 * 60 * 30,

      // Retry failed requests once (per architecture spec)
      retry: 1,

      // Refetch on window focus (good for mobile app resume)
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
    },
  },
})
