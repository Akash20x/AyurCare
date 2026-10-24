"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { useAppointments } from "@/hooks";
import { appointmentKeys } from "@/hooks/useAppointments";
import { useQueryClient } from "@tanstack/react-query";
import { getNextAppointment } from "@/lib/appointments";
import { CalendarDays, Clock, Mail } from "lucide-react";
import { ApiResponse, AppointmentListItem, AppointmentStatus } from "@/types";
import { formatTimeOnly } from "@/lib/helpers";

function hasDifferentContactEmail(contactEmail: string | null, accountEmail?: string) {
  return Boolean(
    contactEmail
      && accountEmail
      && contactEmail.trim().toLowerCase() !== accountEmail.trim().toLowerCase()
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeFilter, setActiveFilter] = useState<AppointmentStatus | "all">(
    "BOOKED"
  );
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past" | "all">(
    "upcoming"
  );

  // The API combines status and time filters inconsistently. Fetch the chosen
  // status without a time filter and apply the display-only date filter here.
  const { data, isLoading, isError, error } = useAppointments(
    activeFilter === "all" ? undefined : activeFilter,
    "all"
  );

  const appointments = useMemo(() => {
    const allAppointments = data?.data || [];
    if (activeFilter === "RESCHEDULED" || timeFilter === "all") return allAppointments;

    const now = new Date();
    return allAppointments.filter((appointment) => {
      if (!appointment.timeSlot) return timeFilter === "past";
      const date = appointment.timeSlot.date.split("T")[0];
      const slotDate = new Date(`${date}T${appointment.timeSlot.startTime}`);
      return timeFilter === "upcoming" ? slotDate >= now : slotDate < now;
    });
  }, [activeFilter, data?.data, timeFilter]);
  const queryClient = useQueryClient();

  const defaultUpcomingData = queryClient.getQueryData<
    ApiResponse<AppointmentListItem[]>
  >(appointmentKeys.lists(user?.id, "BOOKED", "all"));

  const nextAppointment = getNextAppointment(defaultUpcomingData?.data || []);

  const handleViewDetails = (appointmentId: string) => {
    router.push(`/appointment/${appointmentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-semibold text-green-700 py-3 sm:py-4">
          Dashboard
        </h1>

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl shadow-sm p-4 sm:p-6 border border-green-100 my-3 sm:my-4">
          <h1 className="text-xl sm:text-2xl font-bold text-green-800">
            Welcome back, {user?.name || "User"}!
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="text-sm sm:text-base">{user?.email}</span>
          </div>
        </div>

        {/* Upcoming Appointment */}
        {nextAppointment && (
          <Card className="border-green-100 shadow-md mt-5 mb-4">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <p className="text-green-700 text-lg sm:text-xl font-bold mb-1">
                    Upcoming Appointment
                  </p>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {nextAppointment.doctor?.name}
                  </h2>
                  <p className="text-gray-500 text-sm sm:text-base">
                    {nextAppointment.doctor?.specialization}
                  </p>
                </div>

                {nextAppointment.timeSlot ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 bg-green-50 text-green-800 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
                      <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>
                        {new Date(nextAppointment.timeSlot.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-800 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>
                        {formatTimeOnly(nextAppointment.timeSlot.startTime)} –{" "}
                        {formatTimeOnly(nextAppointment.timeSlot.endTime)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Slot details are unavailable</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-8 mb-4 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-green-800">
            Your Appointments
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto">
              <label className="text-sm font-medium text-gray-700">Time:</label>
              <select
                className="h-11 w-full rounded-md border bg-white px-3 text-sm sm:w-auto sm:text-base"
                value={timeFilter}
                onChange={(e) =>
                  setTimeFilter(e.target.value as "upcoming" | "past" | "all")
                }
                disabled={activeFilter === "RESCHEDULED"}
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto">
              <label className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                className="h-11 w-full rounded-md border bg-white px-3 text-sm sm:w-auto sm:text-base"
                value={activeFilter}
                onChange={(e) => {
                  const status = e.target.value as AppointmentStatus | "all";
                  setActiveFilter(status);
                  if (status === "RESCHEDULED") setTimeFilter("all");
                }}
              >
                <option value="BOOKED">Booked</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="all">All Status</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading && (
          <div role="status" aria-label="Loading appointments" className="space-y-3">
            <span className="sr-only">Loading appointments</span>
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-44 w-full rounded-xl bg-slate-200/70" />)}
          </div>
        )}

        {isError && (
          <p className="text-center text-red-500 py-6">
            Failed to load appointments: {error?.message}
          </p>
        )}

        {!isLoading &&
          !isError &&
          appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="border border-green-100 shadow-sm hover:shadow-md transition rounded-xl my-3 text-sm sm:text-base"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto">
                  <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                    {appointment.doctor.name}
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base">
                    {appointment.doctor.specialization}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
                    <span>Fee: {appointment.consultationFee !== null ? `₹${appointment.consultationFee}` : "Not recorded"}</span>
                    {hasDifferentContactEmail(appointment.contactEmail, user?.email) && appointment.patientName && (
                      <span>• Patient Name: {appointment.patientName}</span>
                    )}
                    {hasDifferentContactEmail(appointment.contactEmail, user?.email) && (
                      <span>• Patient Email: {appointment.contactEmail}</span>
                    )}
                  </div>

                  {appointment.timeSlot ? (
                    <div className="mt-3">
                      {appointment.status === "RESCHEDULED" && <p className="mb-2 text-xs font-semibold text-blue-800 sm:text-sm">Previous appointment</p>}
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 sm:gap-3">
                        <div className={`flex items-center gap-1 rounded-md px-2 py-1 ${appointment.status === "RESCHEDULED" ? "bg-blue-50" : "bg-green-50"}`}>
                          <CalendarDays className={`h-4 w-4 ${appointment.status === "RESCHEDULED" ? "text-blue-700" : "text-green-700"}`} />
                          {new Date(appointment.timeSlot.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>

                        <div className={`flex items-center gap-1 rounded-md px-2 py-1 ${appointment.status === "RESCHEDULED" ? "bg-blue-50" : "bg-green-50"}`}>
                          <Clock className={`h-4 w-4 ${appointment.status === "RESCHEDULED" ? "text-blue-700" : "text-green-700"}`} />
                          {formatTimeOnly(appointment.timeSlot.startTime)} –{" "}
                          {formatTimeOnly(appointment.timeSlot.endTime)}
                        </div>
                      </div>
                      {appointment.status === "RESCHEDULED" && <p className="mt-2 text-sm text-muted-foreground">This appointment was rescheduled. Check your active appointment for the updated time.</p>}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {appointment.status === "RESCHEDULED"
                        ? "This rescheduled record has no saved previous time."
                        : "This appointment has no active slot."}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-end">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm ${appointment.status === "CANCELLED" ? "border-red-200 bg-red-50 text-red-700" : appointment.status === "RESCHEDULED" ? "border-blue-200 bg-blue-100 text-blue-800" : "border-green-200 bg-green-100 text-green-800"}`}>
                    {appointment.status}
                  </span>
                  <Button
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-100 text-sm sm:text-base px-4"
                    onClick={() => handleViewDetails(appointment.id)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

        {!isLoading && !isError && appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="bg-green-100 rounded-full p-5 sm:p-6 mb-4 flex items-center justify-center">
              <CalendarDays className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              Try adjusting your filters or book a new appointment.
            </p>

            <Button
              className="bg-green-700 hover:bg-green-800 text-white px-5 sm:px-6 py-2 rounded-md text-sm sm:text-base"
              onClick={() => router.push("/explore")}
            >
              Browse Doctors
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
