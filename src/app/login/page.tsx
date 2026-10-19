"use client";

import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><Skeleton className="h-96 w-full max-w-md rounded-2xl" /></div>}>
      <LoginPageClient />
    </Suspense>
  );
}
