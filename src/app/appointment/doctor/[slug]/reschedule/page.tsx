"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useDoctorById, useSlot, useConfirmReschedule } from "@/hooks";
import { toast } from "sonner";
import { formatDateLong } from "@/lib/helpers/dateHelpers";

export default function RescheduleConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated } = useAuthStore();

  const newSlotId = searchParams.get("slotId");
  const appointmentId = searchParams.get("appointmentId");
  const oldSlotId = searchParams.get("oldSlotId");
  const dateFromUrl = searchParams.get("date");
  const mode = searchParams.get("mode");
  const doctorId = searchParams.get("doctorId"); // must exist in URL

  const { data: doctorData, isLoading: doctorLoading, error: doctorError } = useDoctorById(doctorId);

  const doctor = doctorData?.data;

  // Fetch slot details
  const { data: slotData, isLoading: slotLoading, error: slotError } = useSlot(
    doctorId,
    newSlotId,
    { enabled: Boolean(doctorId && newSlotId) }
  );
  const slot = slotData?.data;

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


  const isLoading = doctorLoading || slotLoading || confirmRescheduleMutation.isPending;
  const error = doctorError?.message || slotError?.message;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600">Loading appointment details...</p>
      </div>
    );
  }

  if (error || !doctor || !slot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="w-full max-w-md border border-red-200 shadow-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 text-lg">{error || "Appointment details not found"}</p>
            <Button variant="outline" className="mt-6 w-40 mx-auto" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main page
  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 flex items-center justify-center">
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-800">
              Confirm Appointment Reschedule
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Doctor Information */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Doctor Information</h2>
              <p className="text-gray-700">Name: {doctor.name}</p>
              <p className="text-gray-700">Specialization: {doctor.specialization}</p>
            </div>

            {/* New Appointment Time */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-3">New Appointment Time</h2>
              {(slot?.date || dateFromUrl) && 
                <p className="text-gray-700"> 
                <span>Date: </span>
                <span>
                  {formatDateLong(slot?.date || dateFromUrl!)}
                </span>
                </p>              
              }
              <p className="text-gray-700">
                Time: {slot.startTime} - {slot.endTime}
              </p>
              {mode && (
                <p className="text-gray-700">
                  Consultation Mode: {mode === "online" ? "Online" : "In-person"}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleReschedule} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Processing..." : "Reschedule Appointment"}
              </Button>
            </div>
          </CardContent> 
        </Card>
      </div>
    </div>
  );
}
