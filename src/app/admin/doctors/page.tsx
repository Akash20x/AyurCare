"use client";

import { AppLink } from "@/components/shared/AppLink";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarPlus, Pencil, Plus, Search, Stethoscope } from "lucide-react";
import { adminApi, doctorApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

function formatSlotDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSlotTime(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;

  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function AdminDoctorsPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"doctors" | "slots">("doctors");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const doctorsQuery = useQuery({ queryKey: ["adminDoctors", query], queryFn: () => doctorApi.getAllDoctors({ q: query || undefined, limit: 50 }), staleTime: 30_000 });
  const slotDoctorsQuery = useQuery({ queryKey: ["adminSlotDoctors"], queryFn: () => doctorApi.getAllDoctors({ limit: 50 }), enabled: tab === "slots", staleTime: 30_000 });
  const doctors = doctorsQuery.data?.data ?? [];
  const slotsQuery = useInfiniteQuery({
    queryKey: ["adminUpcomingSlots", selectedDoctorId],
    queryFn: ({ pageParam }) => adminApi.upcomingSlots(pageParam, selectedDoctorId || undefined),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: tab === "slots",
  });
  const upcomingSlots = slotsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div><h1 className="text-3xl font-bold tracking-tight">Doctors</h1><p className="mt-2 text-muted-foreground">Create profiles and manage appointment availability.</p></div>
        <Button asChild className="bg-green-700 hover:bg-green-800 text-white"><AppLink href="/admin/doctors/new"><Plus aria-hidden="true" />Add doctor</AppLink></Button>
      </div>
      <div className="mb-4 flex gap-2"><Button variant={tab === "doctors" ? "default" : "outline"} onClick={() => setTab("doctors")}>Doctors</Button><Button variant={tab === "slots" ? "default" : "outline"} onClick={() => setTab("slots")}>Upcoming slots</Button></div>
      {tab === "slots" ? (
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Upcoming slots</h2>
              <p className="mt-1 text-muted-foreground">Available times across all doctors, nearest first.</p>
            </div>
            <div className="grid gap-1.5 sm:w-72">
              <label htmlFor="upcoming-slots-doctor" className="text-sm font-medium">Doctor</label>
              <select id="upcoming-slots-doctor" value={selectedDoctorId} onChange={(event) => setSelectedDoctorId(event.target.value)} disabled={slotDoctorsQuery.isLoading} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">All doctors</option>
                {(slotDoctorsQuery.data?.data ?? []).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
              </select>
            </div>
          </div>
          {slotsQuery.isLoading ? (
            <AdminTableSkeleton label="Loading upcoming slots" />
          ) : slotsQuery.isError ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Unable to load upcoming slots. Please try again.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-green-100 dark:border-green-900/40">
              <div className="overflow-x-auto">
                <table className="w-full min-w-180 text-left">
                  <thead className="bg-green-50 text-xs uppercase tracking-wide text-green-900 dark:bg-green-950/30 dark:text-green-100">
                    <tr>
                      <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Doctor</th>
                      <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Specialization</th>
                      <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Clinic</th>
                      <th className="whitespace-nowrap border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Date</th>
                      <th className="px-5 py-3 align-middle font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50 text-sm font-normal text-slate-700 dark:divide-green-900/40 dark:text-slate-300">
                    {upcomingSlots.map((slot) => (
                      <tr key={slot.id} className="h-12 transition-colors hover:bg-green-100/70 dark:hover:bg-green-900/50">
                        <td className="whitespace-nowrap px-5 py-1 align-middle">{slot.doctor.name}</td>
                        <td className="whitespace-nowrap px-5 py-1 align-middle">{slot.doctor.specialization}</td>
                        <td className="whitespace-nowrap px-5 py-1 align-middle">{slot.doctor.clinicName || "Clinic not specified"}{slot.doctor.city ? ` · ${slot.doctor.city}` : ""}</td>
                        <td className="whitespace-nowrap px-5 py-1 align-middle">{formatSlotDate(slot.date)}</td>
                        <td className="whitespace-nowrap px-5 py-1 align-middle">{formatSlotTime(slot.startTime)}–{formatSlotTime(slot.endTime)}</td>
                      </tr>
                    ))}
                    {upcomingSlots.length === 0 && (
                      <tr>
                        <td colSpan={5} className="h-28 text-center text-muted-foreground">No upcoming slots. Create a doctor schedule to make appointment times available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {slotsQuery.hasNextPage && (
            <div className="mt-5 flex justify-center">
              <Button variant="outline" onClick={() => slotsQuery.fetchNextPage()} disabled={slotsQuery.isFetchingNextPage}>
                {slotsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </section>
      ) : <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Doctor directory</CardTitle><CardDescription>{doctorsQuery.isLoading ? "Loading doctors…" : `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} shown`}</CardDescription></div>
          <div className="relative w-full sm:w-96 lg:w-[28rem]"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input aria-label="Search doctors" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or specialty" className="pl-9" /></div>
        </CardHeader>
        <CardContent>
          {doctorsQuery.isError ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Unable to load doctors. Please try again.</p> : doctorsQuery.isLoading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-muted" />)}</div> : doctors.length === 0 ? <div className="py-12 text-center"><Stethoscope className="mx-auto mb-3 size-8 text-green-700" aria-hidden="true" /><p className="font-medium">No doctors found</p><p className="mt-1 text-sm text-muted-foreground">Create a doctor profile to start managing availability.</p></div> : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor) => (
                <article key={doctor.id} className="flex min-h-56 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-green-200 hover:shadow-md dark:hover:border-green-900">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold tracking-tight">{doctor.name}</h2>
                      <Badge variant="secondary" className="shrink-0 bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-100">{doctor.specialization}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{doctor.clinicName || "Clinic not specified"}{doctor.city ? ` · ${doctor.city}` : ""}</p>
                    <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl bg-green-50/70 text-sm dark:bg-green-950/30">
                      <div className="px-4 py-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Experience</p><p className="mt-1 font-medium">{doctor.experience} years</p></div>
                      <div className="border-l border-green-100 px-4 py-3 dark:border-green-900/60"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Consultation fee</p><p className="mt-1 font-medium">₹{doctor.consultationFee ?? 500}</p></div>
                    </div>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                    <Button asChild size="sm" variant="outline" className="h-10">
                      <AppLink href={`/admin/doctors/${doctor.id}/edit`}><Pencil className="size-4" aria-hidden="true" />Edit</AppLink>
                    </Button>
                    <Button asChild size="sm" className="h-10 bg-green-700 text-white hover:bg-green-800">
                      <AppLink href={`/admin/doctors/${doctor.id}/schedule`}><CalendarPlus className="size-4" aria-hidden="true" />Schedule</AppLink>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="col-span-2 h-10 border-green-200 text-green-800 hover:bg-green-50 hover:text-green-900">
                      <AppLink href={`/admin/doctors/${doctor.id}/appointments`}><CalendarDays className="size-4" aria-hidden="true" />Appointments</AppLink>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>}
    </main>
  );
}
