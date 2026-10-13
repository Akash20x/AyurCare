import { Suspense } from "react";
import { DoctorGrid } from "@/components/catalog/DoctorGrid";
import { DoctorGridSkeleton } from "@/components/catalog/DoctorGridSkeleton";
import { ExploreFilters } from "@/components/catalog/ExploreFilters";
import { listDoctors, normalizeDoctorQuery } from "@/lib/server/doctorCatalog";
import type { DoctorQuery } from "@/types";

async function ExploreDoctorResults({ filter }: { filter: DoctorQuery }) {
  const result = await listDoctors(filter);
  if (result.error) return <p className="text-center text-red-600 text-sm">{result.error}</p>;
  return <DoctorGrid doctors={result.data} emptyMessage="No results." />;
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filter = normalizeDoctorQuery(await searchParams);
  const filterKey = JSON.stringify(filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold text-green-700">Explore Doctors</h1>
        <ExploreFilters key={filterKey} initialFilter={filter} />
        <Suspense fallback={<DoctorGridSkeleton />}>
          <ExploreDoctorResults filter={filter} />
        </Suspense>
      </div>
    </div>
  );
}
