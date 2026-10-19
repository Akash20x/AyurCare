"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { QueryProvider } from "./QueryProvider";

interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  // Subscribe only to stable actions. Subscribing to the whole store makes this
  // component re-render for every auth-state update during initialization.
  const getSession = useAuthStore((state) => state.getSession);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { authenticated, shouldRefresh } = await getSession();
        if (!authenticated && shouldRefresh) await refreshToken();
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [getSession, refreshToken, setLoading]);

  return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <QueryProvider>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryProvider>
  );
}
