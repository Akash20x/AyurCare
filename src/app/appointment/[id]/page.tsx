"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { useAppointment, useCancelAppointment } from "@/hooks";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, IndianRupee, Mail, Phone, Stethoscope, UserRound } from "lucide-react";
import { can24HoursBefore, formatDateLong, formatTimeOnly } from "@/lib/helpers";

export default function AppointmentDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const appointmentId = params?.id;

  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useAppointment(appointmentId, {
    enabled: Boolean(appointmentId),
  });

  const appointment = data?.data;
  const cancelMutation = useCancelAppointment();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const canCancel = Boolean(
    appointment?.status === "BOOKED" &&
    appointment.timeSlot &&
    can24HoursBefore(appointment.timeSlot.date, appointment.timeSlot.startTime)
  );
  const canReschedule = canCancel;
  // Redirect unauthenticated users
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (isAuthenticated === false && !token) {
      const currentUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?next=${currentUrl}`);
    }
  }, [isAuthenticated, router]);


  // --- Cancel handler ---
  const handleCancelAppointment = () => {
    if (!appointment?.id) return;
    cancelMutation.mutate(
      { id: appointment.id },
      {
        onSuccess: () => {
          setShowCancelModal(false);
        },
      }
    );
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-5" role="status" aria-label="Loading appointment details">
          <span className="sr-only">Loading appointment details</span>
          <Skeleton className="mx-auto h-8 w-56" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md sm:max-w-2xl shadow-2xl border-0">
          <CardContent className="p-6 sm:p-8">
            <p className="text-red-600 text-center text-base sm:text-lg">
              {error ? String(error) : "Appointment not found"}
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = appointment.status === "BOOKED" ? "Confirmed" : appointment.status;
  const statusClassName = {
    BOOKED: "border-emerald-200 bg-emerald-100 text-emerald-800",
    COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
    CANCELLED: "border-red-200 bg-red-100 text-red-700",
    RESCHEDULED: "border-blue-200 bg-blue-100 text-blue-700",
  }[appointment.status];
  const hasPatientDetails = Boolean(
    appointment.patientAge !== null
    || appointment.patientGender
    || appointment.patientPhone
  );

  // --- Main UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Button onClick={() => router.push("/dashboard")} variant="ghost" className="mb-4 h-11 px-2 text-green-800 hover:bg-green-50 hover:text-green-900">
          <ArrowLeft className="size-4" aria-hidden="true" />My appointments
        </Button>

        <Card className="overflow-hidden border border-green-100 shadow-lg">
          <CardHeader className="border-b border-green-100 bg-gradient-to-r from-emerald-50 to-green-50 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Appointment details</CardTitle>
              </div>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${statusClassName}`}>
                {appointment.status === "BOOKED" && <CheckCircle2 className="size-4" aria-hidden="true" />}
                {statusLabel}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            {appointment.timeSlot && appointment.status !== "RESCHEDULED" ? (
              <section className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5" aria-labelledby="visit-heading">
                <h2 id="visit-heading" className="mb-4 text-base font-semibold text-slate-900">Your visit</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-green-700" aria-hidden="true" />
                    <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{formatDateLong(appointment.timeSlot.date)}</p></div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock3 className="mt-0.5 size-4 shrink-0 text-green-700" aria-hidden="true" />
                    <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Time</p><p className="mt-0.5 whitespace-nowrap text-sm font-semibold text-slate-800">{formatTimeOnly(appointment.timeSlot.startTime)}–{formatTimeOnly(appointment.timeSlot.endTime)}</p></div>
                  </div>
                  {appointment.consultationFee !== null && (
                    <div className="flex items-start gap-2.5">
                      <IndianRupee className="mt-0.5 size-4 shrink-0 text-green-700" aria-hidden="true" />
                      <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Consultation fee</p><p className="mt-0.5 text-sm font-semibold text-slate-800">₹{appointment.consultationFee}</p></div>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                {appointment.status === "RESCHEDULED"
                  ? "This appointment was replaced by a rescheduled booking and is retained as history only."
                  : "This appointment has no active slot information."}
              </section>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="doctor-heading">
                <div className="mb-3 flex items-center gap-2 text-slate-900"><Stethoscope className="size-4 text-green-700" aria-hidden="true" /><h2 id="doctor-heading" className="font-semibold">Doctor</h2></div>
                <p className="font-medium text-slate-800">{appointment.doctor.name}</p>
                <p className="mt-1 text-sm text-slate-600">{appointment.doctor.specialization}</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="patient-heading">
                <div className="mb-3 flex items-center gap-2 text-slate-900"><UserRound className="size-4 text-green-700" aria-hidden="true" /><h2 id="patient-heading" className="font-semibold">Patient</h2></div>
                <p className="font-medium text-slate-800">{appointment.patientName || "Patient"}</p>
                {appointment.contactEmail && <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-slate-600"><Mail className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{appointment.contactEmail}</span></p>}
              </section>
            </div>

            {(hasPatientDetails || appointment.notes) && (
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4" aria-labelledby="more-details-heading">
                <h2 id="more-details-heading" className="mb-3 text-sm font-semibold text-slate-900">More details</h2>
                {hasPatientDetails && <div className="grid gap-3 text-sm sm:grid-cols-3">
                  {appointment.patientAge !== null && <p><span className="block text-xs text-slate-500">Age</span><span className="font-medium text-slate-800">{appointment.patientAge}</span></p>}
                  {appointment.patientGender && <p><span className="block text-xs text-slate-500">Gender</span><span className="font-medium capitalize text-slate-800">{appointment.patientGender}</span></p>}
                  {appointment.patientPhone && <p><span className="block text-xs text-slate-500">Phone</span><span className="flex items-center gap-1 font-medium text-slate-800"><Phone className="size-3.5 text-green-700" aria-hidden="true" />{appointment.patientPhone}</span></p>}
                </div>}
                {appointment.notes && <p className={`${hasPatientDetails ? "mt-4 border-t border-slate-200 pt-4" : ""} text-sm text-slate-700`}><span className="font-medium text-slate-900">Notes:</span> {appointment.notes}</p>}
              </section>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-green-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="h-11 w-full hover:bg-green-50 sm:w-auto">Back to Dashboard</Button>
              {canCancel ? <div className="flex flex-col gap-3 sm:flex-row">
                {canReschedule && <Button variant="outline" className="h-11 w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 sm:w-auto" onClick={() => {
                  const doctorSlug = appointment.doctor.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                  router.push(`/doctor/${doctorSlug}/book?appointmentId=${appointment.id}&oldSlotId=${appointment.timeSlot!.id}`);
                }}>Reschedule</Button>}
                <Button variant="outline" className="h-11 w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 sm:w-auto" onClick={() => setShowCancelModal(true)}>Cancel appointment</Button>
              </div> : appointment.status === "BOOKED" && (
                <p className="text-sm text-slate-600">Cancellation and rescheduling are available until 24 hours before the appointment.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && appointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-lg p-5 sm:p-6 max-w-sm w-full mx-auto shadow-lg">
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Cancel Appointment</h3>
              <p className="text-gray-700 text-sm sm:text-base mb-5">
                Are you sure you want to cancel this appointment?
                {appointment.timeSlot && can24HoursBefore(appointment.timeSlot.date, appointment.timeSlot.startTime)
                  ? " This time slot will be released for other patients."
                  : " The appointment will be cancelled, though its slot may not be released."}
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  No, Keep It
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
                  onClick={handleCancelAppointment}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
