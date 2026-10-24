"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { useBookingConfirmation, useConfirmBookingDraft } from "@/hooks";
import { clearBookingRecoveryContext, getBookingRecoveryContext } from "@/lib/bookingRecovery";
import { Check, Clock3, Stethoscope, UserRound } from "lucide-react";
import { formatTime12Hour } from "@/lib/helpers";

type RequestError = Error & { status?: number; code?: string };

function isRecoveryError(error: RequestError) {
  return error.status === 404 || error.status === 409 || error.code === "LOCK_INVALID";
}

function formatCompactDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function AppointmentConfirmationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const { data: confirmationResponse, isLoading: confirmationLoading, error: confirmationError } = useBookingConfirmation();
  const confirmation = confirmationResponse?.data;
  const confirmMutation = useConfirmBookingDraft();
  const doctor = confirmation?.doctor;
  const appointment = confirmation?.appointment;
  const patient = confirmation?.patient;

  const clearDraftState = (clearConfirmation = true) => {
    queryClient.removeQueries({ queryKey: ["bookingDraft"] });
    if (clearConfirmation) {
      queryClient.removeQueries({ queryKey: ["bookingConfirmation"] });
    }
  };
  const returnToSelection = () => {
    const doctorSlug = getBookingRecoveryContext()?.doctorSlug;
    clearDraftState();
    clearBookingRecoveryContext();
    router.push(doctorSlug ? `/doctor/${doctorSlug}/book` : "/explore");
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (isAuthenticated === false && !token) router.push("/login");
  }, [isAuthenticated, router]);

  const handleConfirm = () => {
    setRecoveryMessage(null);
    confirmMutation.mutate(undefined, {
      onSuccess: (response) => {
        if (!response.success) return;
        // Keep the active confirmation query cached until this page unmounts.
        // The backend has just deleted the draft, so removing it here would
        // cause React Query to refetch and receive an expected 404.
        clearDraftState(false);
        clearBookingRecoveryContext();
        setShowSuccessModal(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      },
      onError: (error: RequestError) => {
        if (isRecoveryError(error)) {
          clearDraftState();
          setRecoveryMessage("This booking draft or slot is no longer available. Please choose another slot.");
        }
      },
    });
  };

  if (isAuthenticated === undefined || confirmationLoading) {
    return <div className="min-h-screen p-6 bg-gradient-to-b from-green-50 to-gray-50"><div className="mx-auto max-w-3xl space-y-6" role="status" aria-label="Loading appointment details"><span className="sr-only">Loading appointment details</span><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /><div className="flex justify-end"><Skeleton className="h-10 w-40" /></div></div></div>;
  }

  if (recoveryMessage || confirmationError || !confirmation || !doctor || !appointment || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-gray-50">
        <Card className="w-full max-w-md border border-red-200 shadow-md"><CardContent className="text-center py-8"><p className="text-red-600 text-lg">{recoveryMessage || "Appointment details not found or have expired."}</p><Button variant="outline" className="mt-6" onClick={returnToSelection}>Choose another slot</Button></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-emerald-50 via-white to-stone-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Card className="overflow-hidden border-emerald-100 py-0 shadow-lg shadow-emerald-950/5">
          <CardHeader className="bg-gradient-to-r from-emerald-100 to-green-50 px-5 py-4 sm:px-6">
            <CardTitle className="text-xl font-bold text-emerald-950 sm:text-2xl">Confirm your appointment</CardTitle>
            <p className="mt-1 text-sm text-emerald-900/75">Review the details, then confirm your booking.</p>
          </CardHeader>

          <CardContent className="space-y-3 px-4 py-4 sm:px-6 sm:py-6">
            <section className="rounded-xl border border-emerald-100 bg-white p-3 sm:p-4" aria-labelledby="doctor-details-heading">
              <div className="gap-4 md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:items-center">
                <div className="mb-3 flex items-center gap-2 md:mb-0">
                  <Stethoscope className="size-4 text-emerald-700" aria-hidden="true" />
                  <h2 id="doctor-details-heading" className="text-sm font-semibold text-slate-900">Doctor</h2>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500">Name</dt>
                    <dd className="mt-0.5 text-sm font-semibold leading-snug text-slate-800">{doctor.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Specialization</dt>
                    <dd className="mt-0.5 text-sm font-medium leading-snug text-slate-700">{doctor.specialization}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Consultation fee</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-emerald-800">₹{doctor.consultationFee ?? 500}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 sm:p-4" aria-labelledby="appointment-details-heading">
              <div className="gap-4 md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:items-center">
                <div className="mb-3 flex items-center gap-2 md:mb-0">
                  <Clock3 className="size-4 text-emerald-700" aria-hidden="true" />
                  <h2 id="appointment-details-heading" className="text-sm font-semibold text-slate-900">Appointment</h2>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500">Date</dt>
                    <dd className="mt-0.5 whitespace-nowrap text-sm font-semibold text-slate-800">{formatCompactDate(appointment.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Time</dt>
                    <dd className="mt-0.5 whitespace-nowrap text-sm font-medium text-slate-700">{formatTime12Hour(appointment.startTime, appointment.date)}–{formatTime12Hour(appointment.endTime, appointment.date)}</dd>
                  </div>
                  <div className="col-span-2 min-w-0 md:col-span-1">
                    <dt className="text-xs text-slate-500">Venue</dt>
                    <dd className="mt-0.5 break-words text-sm font-medium leading-snug text-slate-700">{doctor.venue || "Venue not specified"}</dd>
                  </div>
                </dl>
              </div>
            </section>

            {patient && (
              <section className="rounded-xl border border-emerald-100 bg-white p-3 sm:p-4" aria-labelledby="patient-details-heading">
                <div className="gap-4 md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:items-center">
                  <div className="mb-3 flex items-center gap-2 md:mb-0">
                    <UserRound className="size-4 text-emerald-700" aria-hidden="true" />
                    <h2 id="patient-details-heading" className="text-sm font-semibold text-slate-900">Patient details</h2>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
                    <div>
                      <dt className="text-xs text-slate-500">Name</dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-700">{patient.name || "Not specified"}</dd>
                    </div>
                    <div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-0.5 break-all text-sm font-medium text-slate-700">{patient.email}</dd></div>
                    {patient.age !== null && <div><dt className="text-xs text-slate-500">Age</dt><dd className="mt-0.5 text-sm font-medium text-slate-700">{patient.age}</dd></div>}
                    {patient.gender && <div><dt className="text-xs text-slate-500">Gender</dt><dd className="mt-0.5 text-sm font-medium capitalize text-slate-700">{patient.gender}</dd></div>}
                    {patient.phone && <div><dt className="text-xs text-slate-500">Phone</dt><dd className="mt-0.5 text-sm font-medium text-slate-700">{patient.phone}</dd></div>}
                  </dl>
                </div>
              </section>
            )}

            {confirmMutation.isError && !recoveryMessage && (
              <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {confirmMutation.error.message || "Failed to confirm appointment"}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-emerald-100 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" className="h-11 sm:w-auto" onClick={returnToSelection} disabled={confirmMutation.isPending}>
                Leave booking
              </Button>
              <Button className="h-11 bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto" onClick={handleConfirm} disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? "Confirming..." : "Confirm appointment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {showSuccessModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"><div className="text-center"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100"><Check className="h-6 w-6 text-green-600" /></div><h3 className="mt-4 text-lg font-semibold text-green-800">Appointment Confirmed!</h3><p className="mt-2 text-sm text-gray-500">You will be redirected to your dashboard...</p></div></div></div>}
    </div>
  );
}
