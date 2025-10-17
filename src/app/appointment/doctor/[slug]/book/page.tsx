"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useDoctorProfileByName, useSlot, useConfirmAppointment } from "@/hooks";
import { Check } from "lucide-react";
import { formatDateLong, formatTime12Hour } from "@/lib/helpers/dateHelpers";
import { capitalizeFirstLetter } from "@/lib/helpers/stringHelpers";

export default function AppointmentConfirmationPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const slotId = searchParams.get("slotId");
  const mode = searchParams.get("mode");

  const { isAuthenticated } = useAuthStore();
  const { data: fetchedDoctor } = useDoctorProfileByName(slug);
  const doctorId = fetchedDoctor?.id;
  const { data: slotData, isLoading: slotLoading, error: slotError } = useSlot(
    doctorId,
    slotId,
    { enabled: Boolean(doctorId && slotId) }
  );
  const slot = slotData?.data;

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const confirmMutation = useConfirmAppointment();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (isAuthenticated === false && !token) {
      const currentUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      router.push(`/login?next=${currentUrl}`);
    }
  }, [isAuthenticated, router]);

  const handleConfirm = async () => {
    if (!doctorId || !slotId) return;
    confirmMutation.mutate(
      { doctorId, slotId },
      {
        onSuccess: (res) => {
          if (res.success) {
            setShowSuccessModal(true);
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }
        },
        onError: (err) => console.error("Confirm booking error:", err),
      }
    );
  };
   

  if (slotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-gray-50">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-3 text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (slotError || !fetchedDoctor || !slot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-gray-50">
        <Card className="w-full max-w-md border border-red-200 shadow-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 text-lg">
              {slotError ? String(slotError) : "Appointment details not found"}
            </p>
            <Button
              variant="outline"
              className="mt-6 w-40 mx-auto"
              onClick={() => router.push("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-green-50 to-gray-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-lg border-0 rounded-2xl overflow-hidden pt-0">
          <CardHeader className="bg-gradient-to-r from-green-100 to-green-200 py-4">
            <CardTitle className="text-2xl font-bold text-green-800">
              Confirm Your Appointment
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Review your appointment details before confirming
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Doctor Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Doctor Details</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-700">{fetchedDoctor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Specialization</p>
                    <p className="font-medium text-gray-700">{fetchedDoctor.specialization}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium text-gray-700">{fetchedDoctor.experience} years</p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Appointment Details</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-700">{formatDateLong(slot.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                     <p className="font-medium text-gray-700">
                      {formatTime12Hour(slot.startTime, slot.date)} - {formatTime12Hour(slot.endTime, slot.date)}
                    </p>
                  </div>
                  {mode && 
                  <div>
                    <p className="text-sm text-gray-500">Consultation Mode</p>
                    <p className="font-medium text-gray-700">{capitalizeFirstLetter(mode)}</p>
                  </div>                  
                  }
                </div>
              </div>
            </div>
 
            {confirmMutation.isError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
                {(confirmMutation.error)?.message || "Failed to confirm appointment"}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={confirmMutation.isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {confirmMutation.isPending ? "Confirming..." : "Confirm Appointment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-green-800">Appointment Confirmed!</h3>
              <p className="mt-2 text-sm text-gray-500">You will be redirected to your dashboard...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
