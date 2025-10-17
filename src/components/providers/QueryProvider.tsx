"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/types";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Background refetch on window focus
            refetchOnWindowFocus: false,
            // Retry failed requests
            retry: (failureCount, error: unknown) => {
              const e = error as ApiError;
              
              // Don't retry on 401/403 errors
              if (e?.status === 401 || e?.status === 403) return false;
              
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Stale time - data considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache time - data kept in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Refetch interval for real-time data (disabled by default)
            refetchInterval: false,
          },
          mutations: {
            onError: (error: unknown) => {
              console.error("Mutation error:", error);
            },
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
