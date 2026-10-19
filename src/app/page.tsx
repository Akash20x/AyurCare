import { Suspense } from "react";
import { DoctorGrid } from "@/components/catalog/DoctorGrid";
import { DoctorGridSkeleton } from "@/components/catalog/DoctorGridSkeleton";
import { HomeCatalogControls } from "@/components/catalog/HomeCatalogControls";
import { listDoctors, normalizeDoctorQuery } from "@/lib/server/doctorCatalog";

async function HomeDoctorResults({ specialization }: { specialization?: string }) {
  const result = await listDoctors(specialization ? { specialization } : {});
  if (result.error) return <p className="text-center text-red-600 text-sm">{result.error}</p>;
  return <DoctorGrid doctors={result.data.slice(0, 6)} emptyMessage="No doctors available." />;
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filter = normalizeDoctorQuery(await searchParams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">Find Your Ayurvedic Doctor</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Browse our network of certified Ayurvedic practitioners and book in-person consultations based on your health needs and preferences.</p>
      </div>
      <div className="mx-auto max-w-6xl space-y-10">
        <HomeCatalogControls selectedSpecialization={filter.specialization} />
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-green-800">Our Doctors</h2>
          <Suspense fallback={<DoctorGridSkeleton />}>
            <HomeDoctorResults specialization={filter.specialization} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
