"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;

  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function DoctorUpcomingAppointmentsPage() {
  const { id } = useParams<{ id: string }>();
  const appointmentsQuery = useQuery({
    queryKey: ["adminDoctorUpcomingAppointments", id],
    queryFn: () => adminApi.doctorUpcomingAppointments(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  if (appointmentsQuery.isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-3 h-5 w-72" />
        <Skeleton className="mt-8 h-72 w-full rounded-2xl" />
      </main>
    );
  }

  if (appointmentsQuery.isError || !appointmentsQuery.data?.data) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/admin/doctors"><ArrowLeft className="size-4" aria-hidden="true" />Back to doctors</Link>
        </Button>
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Unable to load the doctor’s upcoming appointments.</p>
      </main>
    );
  }

  const { doctor, appointments } = appointmentsQuery.data.data;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/admin/doctors"><ArrowLeft className="size-4" aria-hidden="true" />Back to doctors</Link>
      </Button>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-green-700">Upcoming appointments</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{doctor.name}</h1>
          <p className="mt-2 text-muted-foreground">{doctor.specialization} · Next 10 confirmed appointments</p>
        </div>
        <Button asChild className="bg-green-700 text-white hover:bg-green-800">
          <Link href={`/admin/doctors/${doctor.id}/schedule`}><CalendarDays className="size-4" aria-hidden="true" />Manage schedule</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-green-100 dark:border-green-900/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left">
            <thead className="bg-green-50 text-xs uppercase tracking-wide text-green-900 dark:bg-green-950/30 dark:text-green-100">
              <tr>
                <th className="border-r border-green-100 px-5 py-3 font-semibold dark:border-green-900/40">Patient</th>
                <th className="border-r border-green-100 px-5 py-3 font-semibold dark:border-green-900/40">Contact email</th>
                <th className="border-r border-green-100 px-5 py-3 font-semibold dark:border-green-900/40">Phone</th>
                <th className="border-r border-green-100 px-5 py-3 font-semibold dark:border-green-900/40">Date</th>
                <th className="px-5 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50 text-sm text-slate-700 dark:divide-green-900/40 dark:text-slate-300">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="h-12 transition-colors hover:bg-green-100/70 dark:hover:bg-green-900/50">
                  <td className="whitespace-nowrap px-5 py-2 align-middle font-medium">{appointment.patientName || "Patient not specified"}</td>
                  <td className="whitespace-nowrap px-5 py-2 align-middle">{appointment.contactEmail || "Not provided"}</td>
                  <td className="whitespace-nowrap px-5 py-2 align-middle">{appointment.patientPhone || "Not provided"}</td>
                  <td className="whitespace-nowrap px-5 py-2 align-middle">{formatDate(appointment.timeSlot.date)}</td>
                  <td className="whitespace-nowrap px-5 py-2 align-middle">{formatTime(appointment.timeSlot.startTime)}–{formatTime(appointment.timeSlot.endTime)}</td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-muted-foreground">No upcoming confirmed appointments for this doctor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
