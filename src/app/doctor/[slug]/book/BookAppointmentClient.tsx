"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Clock, MapPin, Building2, Stethoscope, User2, Mail, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDoctorStore } from "@/stores/doctorStore";
import { filterSlots, useAvailableDates, useCreateBookingDraft, useRequestBookingDraftOtp, useRescheduleAppointment } from "@/hooks";
import { useAuthStore } from "@/stores/authStore";
import { formatDateKey, formatTime12Hour, isPastDay, parseDateKey } from "@/lib/helpers";
import { saveBookingRecoveryContext } from "@/lib/bookingRecovery";
import type { Doctor } from "@/types";

const AppointmentCalendar = dynamic(
  () => import("@/components/ui/calendar").then((module) => module.Calendar),
  { ssr: false, loading: () => <div className="h-72 w-72 animate-pulse rounded-md bg-muted" /> }
);

export default function BookAppointmentClient({ doctor, slug }: { doctor: Doctor; slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { consultationMode, setConsultationMode, selectedDate, setSelectedDate, selectedSlotId, setSelectedSlotId } = useDoctorStore();
  const { isAuthenticated, user } = useAuthStore();
  const doctorId = doctor.id;
  const slugParam = slug;

  const createDraftMutation = useCreateBookingDraft();
  const requestDraftOtpMutation = useRequestBookingDraftOtp();
  const rescheduleMutation = useRescheduleAppointment();
  const [contactEmail, setContactEmail] = useState("");
  const [patient, setPatient] = useState(() => ({
    name: user?.name ?? "",
    age: "",
    gender: "",
    phone: "",
  }));
  const [formError, setFormError] = useState<string | null>(null);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const initializedDoctorId = useRef<string | null>(null);

  const appointmentId = searchParams.get("appointmentId") || undefined;
  const oldSlotId = searchParams.get("oldSlotId") || undefined;
  const isRescheduling = Boolean(appointmentId && oldSlotId);
  useEffect(() => {
    setConsultationMode("in_person");
  }, [setConsultationMode]);

  const { data: availability, isLoading: isAvailabilityLoading } = useAvailableDates(doctorId);
  const availableDates = useMemo(() => availability?.dates ?? [], [availability?.dates]);

  const displayDates = availableDates;

  const date = selectedDate || todayKey;
  const slots = useMemo(
    () => filterSlots((availability?.slots ?? []).filter((slot) => slot.date.slice(0, 10) === date), date),
    [availability?.slots, date]
  );

  useEffect(() => {
    const isNewDoctor = initializedDoctorId.current !== doctorId;
    const dateFromUrl = searchParams.get("date");
    const slotFromUrl = searchParams.get("slotId");
    const urlDateIsBookable = Boolean(dateFromUrl && availableDates.includes(dateFromUrl));

    if (!availableDates.length) {
      if (isNewDoctor) {
        setSelectedDate(null);
        setSelectedSlotId(null);
        initializedDoctorId.current = doctorId;
      }
      return;
    }

    const nextDate = isNewDoctor
      ? (urlDateIsBookable ? dateFromUrl! : availableDates[0])
      : (availableDates.includes(selectedDate ?? "")
        ? selectedDate!
        : (urlDateIsBookable ? dateFromUrl! : availableDates[0]));

    if (isNewDoctor || nextDate !== selectedDate) {
      setSelectedDate(nextDate);
      setSelectedSlotId(isNewDoctor && urlDateIsBookable && slotFromUrl ? slotFromUrl : null);
    }

    initializedDoctorId.current = doctorId;
  }, [availableDates, doctorId, searchParams, selectedDate, setSelectedDate, setSelectedSlotId]);

  const selectedContactEmail = contactEmail.trim() || user?.email || "";
  const hasBookingSelection = Boolean(
    consultationMode
    && selectedDate
    && selectedSlotId
    && slots.some((slot) => slot.slotId === selectedSlotId)
  );
  const hasRequiredDetails = Boolean(
    selectedContactEmail
    && (isRescheduling || patient.name.trim())
  );
  const canContinue = hasBookingSelection && (
    isAuthenticated === false
    || (isAuthenticated === true && hasRequiredDetails)
  );

  const validateBookingDetails = () => {
    if (!selectedContactEmail || !/^\S+@\S+\.\S+$/.test(selectedContactEmail)) {
      return "Enter a valid contact email address.";
    }

    if (!patient.name.trim()) return "Enter the patient's name.";

    if (patient.age) {
      const age = Number(patient.age);
      if (!Number.isInteger(age) || age < 0 || age > 150) return "Enter a valid patient age.";
    }
    return null;
  };

  const handleContinue = async () => {
    if (!canContinue || !doctor?.id || !selectedSlotId) return;

    if (!isAuthenticated) {
      const params = new URLSearchParams({
        mode: String(consultationMode || ""),
        ...(selectedDate ? { date: selectedDate } : {}),
        ...(selectedSlotId ? { slotId: selectedSlotId } : {}),
      }).toString();
      router.push(`/login?next=${encodeURIComponent(`/doctor/${slug}/book?${params}`)}`);
      return;
    }

    if (isRescheduling && appointmentId && oldSlotId) {
      rescheduleMutation.mutate({ id: appointmentId, newTimeSlotId: selectedSlotId }, {
        onSuccess: () => {
          const params = new URLSearchParams({
            appointmentId,
            slotId: selectedSlotId!,
            oldSlotId,
            doctorId: doctor.id,
            date: selectedDate!,
            mode: consultationMode!,
          }).toString();
          router.push(`/appointment/doctor/${slugParam}/reschedule?${params}`);
        },
        onError: () => alert("Failed to reschedule. Slot may be unavailable."),
      });
    } else {
      const validationError = validateBookingDetails();
      if (validationError) {
        setFormError(validationError);
        return;
      }

      setFormError(null);
      createDraftMutation.mutate({
        doctorId: doctor.id,
        timeSlotId: selectedSlotId,
        contactEmail: selectedContactEmail,
        bookingForSomeoneElse: false,
        patient: {
          name: patient.name.trim(),
          ...(patient.age ? { age: Number(patient.age) } : {}),
          ...(patient.gender ? { gender: patient.gender as "male" | "female" | "other" } : {}),
          ...(patient.phone.trim() ? { phone: patient.phone.trim() } : {}),
        },
      }, {
        onSuccess: () => {
          saveBookingRecoveryContext({ doctorSlug: slugParam });
          requestDraftOtpMutation.mutate(undefined, {
            onSuccess: () => router.push("/verify-otp"),
            onError: (err) => setFormError(err.message || "Unable to send the verification code."),
          });
        },
        onError: (err) => setFormError(err.message || "Failed to reserve slot. It may be unavailable."),
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
          {/* Doctor Info */}
          <Card className="overflow-hidden border-0 shadow-lg pt-0">
              <CardHeader className="bg-gradient-to-r from-green-200 to-green-200">
                <CardTitle className="flex items-center gap-2 text-healing-green pt-2 text-sm sm:text-base">
                  <Stethoscope className="h-6 w-4 sm:h-8 sm:w-5" /> Doctor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-start gap-3 bg-white p-4 sm:gap-4 sm:p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-healing-green/10 sm:h-[4.5rem] sm:w-[4.5rem]">
                  <User2 className="h-8 w-8 text-healing-green sm:h-10 sm:w-10" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="min-w-0 space-y-0.5 sm:space-y-1">
                    <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">{doctor.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground sm:text-base">{doctor.specialization}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Badge variant="secondary" className="border border-gray-200 bg-gray-50 text-xs text-gray-700 sm:text-sm">{doctor.experience} years experience</Badge>
                    {(doctor.clinicName || doctor.city) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 sm:text-sm">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-healing-green" aria-hidden="true" />
                        {[doctor.clinicName, doctor.city].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  {doctor.consultationFee !== undefined && (
                    <div className="mt-2 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800 sm:text-sm">
                      <span className="font-semibold">Consultation fee</span>
                      <span className="font-semibold">₹{doctor.consultationFee}</span>
                      <span className="text-emerald-700">Pay at your visit</span>
                    </div>
                  )}
                </div>
              </CardContent>
          </Card>

          <Card className="!gap-0 overflow-hidden border-0 !pb-5 pt-0 shadow-lg">
            <CardHeader className="!flex !items-center bg-gradient-to-r from-green-200 to-green-200 !py-3">
              <CardTitle className="text-sm text-healing-green sm:text-base">Consultation type</CardTitle>
            </CardHeader>
            <CardContent className="px-5 !pb-1.5 !pt-4 sm:px-6">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 sm:gap-4">
                <div className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-emerald-100 bg-white text-healing-green shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 sm:text-base">In-Person Visit</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">Visit the clinic directly</div>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-800">At clinic</span>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Date Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-healing-green" /> Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left h-10 sm:h-12 border-2",
                        selectedDate && "border-healing-green text-sm sm:text-base"
                      )}
                    >
                      <CalendarIcon className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
                      {selectedDate
                        ? parseDateKey(selectedDate)!.toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Choose appointment date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <AppointmentCalendar
                      mode="single"
                      selected={selectedDate ? parseDateKey(selectedDate) : undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        const key = formatDateKey(d);
                        const isDisabled = isPastDay(d) || !availableDates.includes(key);
                        if (isDisabled) return;
                        setSelectedDate(key);
                        setSelectedSlotId(null);
                      }}
                      modifiers={{ available: displayDates.map((d) => parseDateKey(d)!) }}
                      disabled={(date) => {
                        const key = formatDateKey(date);
                        return isPastDay(date) || !displayDates.includes(key);
                      }}
                      modifiersClassNames={{ available: "bg-green-100 text-green-800 font-medium rounded-md" }}
                      classNames={{
                        day_selected: "bg-healing-green text-white font-semibold rounded-md",
                        day_today: "border border-dashed border-gray-400",
                        day: "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md focus:outline-none focus:ring-0",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-healing-green" /> Select Time
                  <p className="text-sm text-muted-foreground">(30 minutes Slot)</p>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {isAvailabilityLoading ? (
                    Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full rounded-md" />)
                  ) : slots.length > 0 ? (
                    slots.map((slot) => (
                      <Button
                        key={slot.slotId}
                        type="button"
                        variant={selectedSlotId === slot.slotId ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSlotId(slot.slotId)}
                        className={cn(
                          "h-10 text-sm sm:text-base",
                          selectedSlotId === slot.slotId
                            ? "bg-healing-green text-white shadow-md"
                            : "hover:border-healing-green hover:bg-healing-green-light"
                        )}
                      >
                        {formatTime12Hour(slot.startTime)}
                      </Button>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground col-span-full text-sm sm:text-base">
                      No slots available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {!appointmentId && isAuthenticated === true && (
            <Card className="gap-0 overflow-hidden border border-emerald-100 py-0 shadow-sm">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50/50 px-5 py-3 sm:px-6">
                <CardTitle className="text-base font-semibold text-emerald-950 sm:text-lg">Contact and patient details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-4 sm:px-6">
                <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="contact-details-heading">
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-healing-green">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 id="contact-details-heading" className="text-base font-semibold text-slate-900">Contact details</h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email address <span className="text-red-600">*</span></Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail || user?.email || ""}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-10 bg-white"
                  />
                  <p className="text-xs text-muted-foreground">We will send the verification code to this email.</p>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5" aria-labelledby="patient-details-heading">
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-healing-green">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 id="patient-details-heading" className="text-base font-semibold text-slate-900">Patient details</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                    <Label htmlFor="patient-name">Patient name <span className="text-red-600">*</span></Label>
                    <Input id="patient-name" value={patient.name} onChange={(event) => setPatient({ ...patient, name: event.target.value })} placeholder="Full name" required className="h-10 bg-white" />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="patient-age">Patient age</Label>
                    <Input id="patient-age" type="number" min="0" max="150" value={patient.age} onChange={(event) => setPatient({ ...patient, age: event.target.value })} placeholder="Age in years" className="h-10 bg-white" />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="patient-gender">Patient gender</Label>
                    <select id="patient-gender" value={patient.gender} onChange={(event) => setPatient({ ...patient, gender: event.target.value })} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="patient-phone">Patient phone</Label>
                    <Input id="patient-phone" type="tel" value={patient.phone} onChange={(event) => setPatient({ ...patient, phone: event.target.value })} placeholder="Phone number" className="h-10 bg-white" />
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          )}

          {/* Continue Button */}
          <div className="flex flex-col items-center pt-4 sm:pt-6 space-y-3 sm:space-y-4">
            <Button
              disabled={!canContinue || createDraftMutation.isPending || requestDraftOtpMutation.isPending}
              onClick={handleContinue}
              className="w-full max-w-md h-10 sm:h-12 bg-healing-green hover:bg-healing-green/90 text-white font-semibold shadow-lg text-sm sm:text-base"
            >
              {createDraftMutation.isPending || requestDraftOtpMutation.isPending
                ? "Reserving slot..."
                : "Continue"}
            </Button>
            {formError && <p className="text-sm text-red-600 text-center">{formError}</p>}
            {!canContinue && isAuthenticated !== null && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                {!hasBookingSelection
                  ? "Please select a date and time to continue"
                  : "Enter the required contact and patient details to continue"}
              </p>
            )}
          </div>
    </div>
  );
}
