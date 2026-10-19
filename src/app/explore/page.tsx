import { Suspense } from "react";
import { DoctorGridSkeleton } from "@/components/catalog/DoctorGridSkeleton";
import ExplorePageClient from "./ExplorePageClient";
import { listDoctorPage, normalizeDoctorQuery } from "@/lib/server/doctorCatalog";

async function ExploreResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filter = normalizeDoctorQuery(await searchParams);
  const result = await listDoctorPage(filter);

  return (
    <ExplorePageClient
      key={JSON.stringify(filter)}
      initialPage={result.error ? undefined : result.data}
      initialError={result.error}
    />
  );
}

export default function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DoctorGridSkeleton />}>
      <ExploreResults searchParams={searchParams} />
    </Suspense>
  );
}
