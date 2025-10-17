"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useAppointment, useCancelAppointment } from "@/hooks";
import { can24HoursBefore, formatDateTime, formatTimeOnly } from "@/lib/helpers/dateHelpers";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <p className="text-gray-600 text-center text-base sm:text-lg">
          Loading appointment details...
        </p>
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

  // --- Main UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-6 flex items-center justify-center">
      <div className="container mx-auto max-w-lg sm:max-w-2xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center text-green-800">
              Appointment Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 sm:space-y-6 px-4 sm:px-6 pb-6">
            {/* Doctor Information */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-3">Doctor Information</h2>
              <p className="text-gray-700 text-sm sm:text-base">
                Name: {appointment.doctor.name}
              </p>
              <p className="text-gray-700 text-sm sm:text-base">
                Specialization: {appointment.doctor.specialization}
              </p>
            </div>

            {/* Appointment Information */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-3">Appointment Information</h2>
              {appointment.timeSlot ? (
                <>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Date & Time:{" "}
                    {formatDateTime(appointment.timeSlot.date, appointment.timeSlot.startTime)}
                  </p>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Duration:{" "}
                    {formatTimeOnly(appointment.timeSlot.startTime)} –{" "}
                    {formatTimeOnly(appointment.timeSlot.endTime)}
                  </p>
                </>
              ) : (
                <p className="text-gray-700 text-sm sm:text-base">
                  Time slot information not available
                </p>
              )}
              <p className="text-gray-700 text-sm sm:text-base">
                Status: <span className="capitalize">{appointment.status}</span>
              </p>
              {appointment.notes && (
                <p className="text-gray-700 text-sm sm:text-base mt-2">
                  Notes: {appointment.notes}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="hover:bg-green-50 w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>

              {appointment.timeSlot &&
                appointment.status?.toLowerCase() === "booked" &&
                can24HoursBefore(appointment.timeSlot.date, appointment.timeSlot.startTime) && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 text-red-600 w-full sm:w-auto"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Cancel Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 w-full sm:w-auto"
                      onClick={() => {
                        const doctorSlug = appointment.doctor.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        router.push(
                          `/doctor/${doctorSlug}/book?appointmentId=${appointment.id}&oldSlotId=${appointment.timeSlot.id}`
                        );
                      }}
                    >
                      Reschedule
                    </Button>
                  </div>
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
                {appointment.timeSlot &&
                can24HoursBefore(appointment.timeSlot.date, appointment.timeSlot.startTime)
                  ? " This time slot will be released for other patients."
                  : " It’s within 24 hours, so cancellation may not free the slot."}
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
