"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated === false) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || isAuthenticated === null) {
    return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-busy="true"><Skeleton className="h-9 w-64" /><Skeleton className="mt-5 h-28 w-full rounded-xl" /><div className="mt-5 grid gap-4 md:grid-cols-3"><Skeleton className="h-36 w-full rounded-xl" /><Skeleton className="h-36 w-full rounded-xl" /><Skeleton className="h-36 w-full rounded-xl" /></div></main>;
  }

  if (!isAuthenticated) return null;

  if (user?.role !== "admin") {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <ShieldAlert className="w-8 h-8 text-amber-600 mb-2" aria-hidden="true" />
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Your account is signed in, but it does not have permission to manage AyurCare operations.
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
