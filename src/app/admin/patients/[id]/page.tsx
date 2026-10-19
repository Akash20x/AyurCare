"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime12Hour } from "@/lib/helpers";

function getSlotTime(slot?: { date?: string; startTime?: string }) {
  if (!slot?.date) return null;

  const date = new Date(slot.date).toISOString().slice(0, 10);
  return new Date(`${date}T${slot.startTime || "00:00"}:00`);
}

export default function PatientAppointmentsPage() {
  const { id } = useParams<{ id: string }>();
  const patientHistoryQuery = useQuery({
    queryKey: ["patientHistory", id],
    queryFn: () => adminApi.patientAppointments(id),
  });
  const patientHistory = patientHistoryQuery.data?.data;
  const appointments = patientHistory?.appointments ?? [];
  const now = new Date();
  const upcomingAppointments = appointments.filter((appointment) => {
    const slotTime = getSlotTime(appointment.timeSlot);
    return slotTime && slotTime >= now;
  });
  const pastAppointments = appointments.filter((appointment) => {
    const slotTime = getSlotTime(appointment.timeSlot);
    return !slotTime || slotTime < now;
  });
  const sections = [
    ["Upcoming", upcomingAppointments],
    ["Past", pastAppointments],
  ] as const;

  if (patientHistoryQuery.isLoading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-5 w-52" />
        <div className="mt-8 grid gap-6">
          {[1, 2].map((section) => (
            <section key={section}>
              <Skeleton className="mb-3 h-6 w-24" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </section>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">{patientHistory?.patient.name || "Patient"}’s appointments</h1>
      <p className="mb-6 text-muted-foreground">{patientHistory?.patient.email}</p>

      <div className="grid gap-6">
        {sections.map(([title, items]) => (
          <section key={title}>
            <h2 className="mb-3 text-lg font-semibold">{title}</h2>
            <div className="grid gap-3">
              {items.length ? items.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-5">
                    <p className="font-semibold">{appointment.doctor?.name} · {appointment.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.timeSlot?.date ? new Date(appointment.timeSlot.date).toLocaleDateString() : "No scheduled slot"}
                      {appointment.timeSlot ? ` · ${formatTime12Hour(appointment.timeSlot.startTime, appointment.timeSlot.date)}` : ""}
                    </p>
                  </CardContent>
                </Card>
              )) : <p className="text-sm text-muted-foreground">No {title.toLowerCase()} appointments.</p>}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
