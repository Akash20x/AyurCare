"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { useDoctorById, useSlot, useConfirmReschedule } from "@/hooks";
import { toast } from "sonner";
import { CalendarDays, Clock3, MapPin, Stethoscope } from "lucide-react";
import { formatDateLong, formatTimeOnly } from "@/lib/helpers";

export default function RescheduleConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated } = useAuthStore();

  const newSlotId = searchParams.get("slotId");
  const appointmentId = searchParams.get("appointmentId");
  const oldSlotId = searchParams.get("oldSlotId");
  const dateFromUrl = searchParams.get("date");
  const doctorId = searchParams.get("doctorId"); // must exist in URL

  const { data: doctorData, isLoading: doctorLoading, error: doctorError } = useDoctorById(doctorId);

  const doctor = doctorData?.data;

  const { data: newSlotData, isLoading: newSlotLoading, error: newSlotError } = useSlot(
    doctorId,
    newSlotId,
    { enabled: Boolean(doctorId && newSlotId) }
  );
  const { data: oldSlotData, isLoading: oldSlotLoading, error: oldSlotError } = useSlot(
    doctorId,
    oldSlotId,
    { enabled: Boolean(doctorId && oldSlotId) }
  );
  const newSlot = newSlotData?.data;
  const oldSlot = oldSlotData?.data;

  // Mutation to confirm reschedule
  const confirmRescheduleMutation = useConfirmReschedule();

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (isAuthenticated === false && !token) {
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?next=${currentUrl}`);
    }
  }, [isAuthenticated, router]);

  // Handle confirm reschedule
  const handleReschedule = () => {
    if (!appointmentId || !oldSlotId || !newSlotId || !doctorId) {
      toast.error("Missing required appointment details");
      return;
    }

    confirmRescheduleMutation.mutate(
      { appointmentId, oldSlotId, newSlotId, doctorId },
      {
        onSuccess: () => {
          toast.success("Appointment rescheduled successfully!");
          router.push("/dashboard");
        },
        onError: (err) => {
          const msg = err?.message || "Failed to reschedule appointment";
          toast.error(msg);
        },
      }
    );
  };


  const isPageLoading = doctorLoading || newSlotLoading || oldSlotLoading;
  const error = doctorError?.message || newSlotError?.message || oldSlotError?.message;

  if (isPageLoading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-emerald-50 via-white to-stone-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl space-y-5" role="status" aria-label="Loading reschedule details">
          <span className="sr-only">Loading reschedule details</span>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /></div>
          <div className="flex justify-end"><Skeleton className="h-11 w-44 rounded-lg" /></div>
        </div>
      </div>
    );
  }

  if (error || !doctor || !newSlot || !oldSlot) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-stone-50 p-6">
        <Card className="w-full max-w-md border border-red-200 shadow-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 text-lg">{error || "Appointment details not found"}</p>
            <Button variant="outline" className="mx-auto mt-6" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const venue = [doctor.clinicName, doctor.city].filter(Boolean).join(", ") || "Clinic venue";
  const newDate = newSlot.date || dateFromUrl!;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-emerald-50 via-white to-stone-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Card className="overflow-hidden border-emerald-100 py-0 shadow-lg shadow-emerald-950/5">
          <CardHeader className="bg-gradient-to-r from-emerald-100 to-green-50 px-5 py-4 sm:px-6">
            <CardTitle className="text-xl font-bold text-emerald-950 sm:text-2xl">
              Confirm reschedule
            </CardTitle>
            <p className="mt-1 text-sm text-emerald-900/75">Review the new appointment time before confirming.</p>
          </CardHeader>

          <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
            <section className="rounded-xl border border-emerald-100 bg-white p-4" aria-labelledby="reschedule-doctor-heading">
              <div className="gap-4 md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:items-center">
                <div className="mb-3 flex items-center gap-2 md:mb-0">
                  <Stethoscope className="size-4 text-emerald-700" aria-hidden="true" />
                  <h2 id="reschedule-doctor-heading" className="text-sm font-semibold text-slate-900">Doctor</h2>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div><dt className="text-xs text-slate-500">Name</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{doctor.name}</dd></div>
                  <div><dt className="text-xs text-slate-500">Specialization</dt><dd className="mt-0.5 text-sm font-medium text-slate-700">{doctor.specialization}</dd></div>
                </dl>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5" aria-labelledby="current-appointment-heading">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="size-4 text-slate-600" aria-hidden="true" />
                  <h2 id="current-appointment-heading" className="font-semibold text-slate-900">Current appointment</h2>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <div><dt className="text-xs text-slate-500">Date</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDateLong(oldSlot.date)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Time</dt><dd className="mt-1 whitespace-nowrap text-sm font-semibold text-slate-800">{formatTimeOnly(oldSlot.startTime)}–{formatTimeOnly(oldSlot.endTime)}</dd></div>
                </dl>
              </section>

              <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5" aria-labelledby="new-appointment-heading">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-emerald-700" aria-hidden="true" />
                    <h2 id="new-appointment-heading" className="font-semibold text-emerald-950">New appointment</h2>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-800">Selected</span>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <div><dt className="text-xs text-emerald-800/70">Date</dt><dd className="mt-1 text-sm font-semibold text-emerald-950">{formatDateLong(newDate)}</dd></div>
                  <div><dt className="text-xs text-emerald-800/70">Time</dt><dd className="mt-1 whitespace-nowrap text-sm font-semibold text-emerald-950">{formatTimeOnly(newSlot.startTime)}–{formatTimeOnly(newSlot.endTime)}</dd></div>
                </dl>
              </section>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <span><span className="font-medium text-slate-800">In-person visit</span> at {venue}</span>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-emerald-100 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" className="h-11 sm:w-auto" onClick={() => router.back()} disabled={confirmRescheduleMutation.isPending}>
                Go back
              </Button>
              <Button onClick={handleReschedule} disabled={confirmRescheduleMutation.isPending} className="h-11 bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto">
                {confirmRescheduleMutation.isPending ? "Rescheduling..." : "Confirm reschedule"}
              </Button>
            </div>
          </CardContent> 
        </Card>
      </div>
    </div>
  );
}
