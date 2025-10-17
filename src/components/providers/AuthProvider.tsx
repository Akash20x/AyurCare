"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getAuthToken } from "@/lib/api";
import { QueryProvider } from "./QueryProvider";

interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { getMe, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          setLoading(true);
          await getMe();
        } catch (error) {
          console.error("Failed to initialize auth:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [getMe, setLoading]);

  return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <QueryProvider>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryProvider>
  );
}
