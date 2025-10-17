"use client";

import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <LoginPageClient />
    </Suspense>
  );
}
