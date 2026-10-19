"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DoctorGrid } from "@/components/catalog/DoctorGrid";
import { DoctorGridSkeleton } from "@/components/catalog/DoctorGridSkeleton";
import { ExploreFilters } from "@/components/catalog/ExploreFilters";
import { useInfiniteDoctors } from "@/hooks/useDoctors";
import type { DoctorQuery, PaginatedDoctorResponse } from "@/types";

function queryFromSearchParams(searchParams: Pick<URLSearchParams, "get">): DoctorQuery {
  const q = searchParams.get("q")?.trim();
  const specialization = searchParams.get("specialization")?.trim();
  const earliestAvailable = searchParams.get("available") === "earliest" ? "earliest" : undefined;

  return {
    ...(q ? { q } : {}),
    ...(specialization ? { specialization } : {}),
    ...(earliestAvailable ? { earliestAvailable } : {}),
  };
}

export default function ExplorePageClient({ initialPage, initialError }: { initialPage?: PaginatedDoctorResponse; initialError?: string | null }) {
  const searchParams = useSearchParams();
  const filterKey = searchParams.toString();
  const filter = queryFromSearchParams(searchParams);
  const { data, error, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isLoading } = useInfiniteDoctors(filter, initialPage);
  const doctors = data?.pages.flatMap((page) => page.data ?? []) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold text-green-700">Explore Doctors</h1>
        <ExploreFilters key={filterKey} initialFilter={filter} />

        {isLoading ? <DoctorGridSkeleton /> : initialError || isError ? (
          <p className="text-center text-sm text-red-600">{initialError || error.message || "Unable to load doctors right now."}</p>
        ) : (
          <>
            <DoctorGrid doctors={doctors} emptyMessage="No results." />
            {hasNextPage ? (
              <div className="flex justify-center pt-2">
                <Button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
