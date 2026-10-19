"use client";

import { Suspense } from "react";
import VerifyOtpPageClient from "./VerifyOtpPageClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-gray-50 p-4"><Skeleton className="h-72 w-full max-w-md rounded-2xl" /></div>}>
      <VerifyOtpPageClient />
    </Suspense>
  );
}
