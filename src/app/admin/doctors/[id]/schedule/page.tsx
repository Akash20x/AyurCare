"use client";

import { AppLink } from "@/components/shared/AppLink";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScheduleManager } from "@/components/admin/ScheduleManager";
import { useDoctorById } from "@/hooks/useDoctors";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorSchedulePage() {
  const params = useParams<{ id: string }>();
  const doctor = useDoctorById(params.id);
  if (doctor.isLoading) return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-busy="true"><Skeleton className="h-5 w-36" /><Skeleton className="mt-3 h-9 w-64" /><Skeleton className="mt-3 h-5 w-96" /><div className="mt-8 grid gap-6 lg:grid-cols-2"><Skeleton className="h-[25rem] w-full rounded-xl" /><Skeleton className="h-[25rem] w-full rounded-xl" /><Skeleton className="h-52 w-full rounded-xl lg:col-span-2" /></div></main>;
  if (doctor.isError || !doctor.data?.data) return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Doctor profile could not be loaded.</p></main>;
  const profile = doctor.data.data;
  return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"><div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-green-700">Availability schedule</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{profile.name}</h1><p className="mt-2 text-muted-foreground">{profile.specialization} · Create availability patients can book.</p></div><Button asChild variant="outline"><AppLink href={`/admin/doctors/${profile.id}/edit`}>Edit doctor</AppLink></Button></div><ScheduleManager doctorId={profile.id} /></main>;
}
