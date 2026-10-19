"use client";

import { useParams } from "next/navigation";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { useDoctorById } from "@/hooks/useDoctors";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditDoctorPage() {
  const params = useParams<{ id: string }>();
  const doctor = useDoctorById(params.id);
  if (doctor.isLoading) return <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-busy="true"><Skeleton className="h-5 w-28" /><Skeleton className="mt-3 h-9 w-52" /><Skeleton className="mt-8 h-[26rem] w-full rounded-xl" /></main>;
  if (doctor.isError || !doctor.data?.data) return <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Doctor profile could not be loaded.</p></main>;
  return <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"><div className="mb-8"><p className="text-sm font-medium text-green-700">Doctor directory</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Edit doctor</h1></div><DoctorForm doctor={doctor.data.data} /></main>;
}
