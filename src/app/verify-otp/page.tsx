"use client";

import { Suspense } from "react";
import VerifyOtpPageClient from "./VerifyOtpPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpPageClient />
    </Suspense>
  );
}
