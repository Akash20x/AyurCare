"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

const formatTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
};

export default function AppointmentsPage() {
  const [status, setStatus] = useState("BOOKED");
  const [page, setPage] = useState(1);
  const appointmentsQuery = useQuery({
    queryKey: ["todayAppointments", status, page],
    queryFn: () => adminApi.todayAppointments(status, page),
  });
  const appointments = appointmentsQuery.data?.data ?? [];
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-bold">Today’s Appointments</h1></div>
        <select aria-label="Appointment status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-green-100 bg-green-50 px-3 text-sm font-medium text-green-900 outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:bg-green-950/30 dark:text-green-100">
          <option value="BOOKED">Active</option><option value="all">All</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option><option value="RESCHEDULED">Rescheduled</option>
        </select>
      </div>
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200">
          <CalendarDays className="size-4" aria-hidden="true" />
        </span>
        <p>
          Showing appointments for <span className="font-semibold text-foreground">{todayLabel}</span>
        </p>
      </div>
      {appointmentsQuery.isLoading ? <AdminTableSkeleton label="Loading today’s appointments" /> : <div className="overflow-hidden rounded-2xl border border-green-100 dark:border-green-900/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="bg-green-50 text-xs uppercase tracking-wide text-green-900 dark:bg-green-950/30 dark:text-green-100">
              <tr>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Patient</th>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Doctor</th>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Time</th>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Contact</th>
                <th className="px-5 py-3 align-middle font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50 text-sm font-normal text-slate-700 dark:divide-green-900/40 dark:text-slate-300">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="h-12 transition-colors hover:bg-green-100/70 dark:hover:bg-green-900/50">
                  <td className="px-5 py-1 align-middle">
                    <span>{appointment.patientName || appointment.contactEmail || "Patient"}</span>
                  </td>
                  <td className="px-5 py-1 align-middle">
                    <span>{appointment.doctor?.name}</span>
                  </td>
                  <td className="px-5 py-1 align-middle">
                    <span>{appointment.timeSlot ? formatTime(appointment.timeSlot.startTime) : "No slot"}</span>
                  </td>
                  <td className="px-5 py-1 align-middle">{appointment.patientPhone || appointment.contactEmail || "—"}</td>
                  <td className="px-5 py-1 align-middle">{appointment.status}</td>
                </tr>
              ))}
              {!appointments.length && (
                <tr>
                  <td colSpan={5} className="h-28 text-center text-muted-foreground">No appointments for this filter today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}
      {appointmentsQuery.data?.hasMore && <Button className="mt-5" variant="outline" onClick={() => setPage(page + 1)}>Load more</Button>}
    </main>
  );
}
