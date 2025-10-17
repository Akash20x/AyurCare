"use client";

import { Suspense } from "react";
import ExplorePageClient from "./ExplorePageClient";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ExplorePageClient />
    </Suspense>
  );  
}