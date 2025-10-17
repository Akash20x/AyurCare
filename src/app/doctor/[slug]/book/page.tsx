"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Video, MapPin, ArrowLeft, User2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDoctorStore } from "@/stores/doctorStore";
import { useAvailableDates, useAvailableSlots, useDoctorProfileByName, useLockSlot, useRescheduleAppointment } from "@/hooks";
import { useAuthStore } from "@/stores/authStore";
import { formatDateKey, formatTime12Hour, isPastDay, parseDateKey } from "@/lib/helpers/dateHelpers";

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");

  const { selectedDoctor, consultationMode, setConsultationMode, selectedDate, setSelectedDate, selectedSlotId, setSelectedSlotId } = useDoctorStore();
  const { isAuthenticated } = useAuthStore();
  const slugParam = Array.isArray(slug) ? slug[0] : slug;

  const { data: fetchedDoctor, isLoading, error } = useDoctorProfileByName(slugParam, {
    enabled: !selectedDoctor && Boolean(slugParam),
  });
  const doctor = selectedDoctor || fetchedDoctor;
  const doctorId = doctor?.id;

  const lockSlotMutation = useLockSlot();
  const rescheduleMutation = useRescheduleAppointment();
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const appointmentId = searchParams.get("appointmentId") || undefined;
  const oldSlotId = searchParams.get("oldSlotId") || undefined;

  useEffect(() => {
    if (!doctor) return;

    const urlMode = String(searchParams.get("mode") || "").toLowerCase();
    if (urlMode === "online" || urlMode === "in-person") {
      setConsultationMode(urlMode === "in-person" ? "in_person" : "online");
    } else if (doctor.consultationMode === "online") {
      setConsultationMode("online");
    } else if (doctor.consultationMode === "in_person") {
      setConsultationMode("in_person");
    }

    if (!selectedDate) setSelectedDate(searchParams.get("date") || todayKey);
    if (!selectedSlotId) setSelectedSlotId(searchParams.get("slotId"));
  }, [doctor, consultationMode, searchParams, selectedDate, selectedSlotId, setConsultationMode, setSelectedDate, setSelectedSlotId, todayKey]);

  const { data: availableDates = [] } = useAvailableDates(doctorId);

  const displayDates = availableDates.includes(todayKey)
  ? availableDates
  : [...availableDates, todayKey];

  const date = selectedDate || todayKey;
  const { data: slots = [] } = useAvailableSlots(doctorId && selectedDate ? { doctorId, date } : undefined);

  useEffect(() => {
    if (!availableDates.length) return;

    if (!selectedDate || !availableDates.includes(selectedDate)) {
      const dateFromUrl = searchParams.get("date");
      if (dateFromUrl && availableDates.includes(dateFromUrl)) {
        setSelectedDate(dateFromUrl);
        setSelectedSlotId(null);
      } else {
        const fallbackDate = todayKey && !isPastDay(parseDateKey(todayKey)!) ? todayKey : availableDates[0];
        setSelectedDate(fallbackDate);
        setSelectedSlotId(null);
      }
    }
  }, [availableDates, selectedDate, todayKey, searchParams, setSelectedDate, setSelectedSlotId]);

  const canContinue = Boolean(consultationMode && selectedDate && selectedSlotId);

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

    if (appointmentId && oldSlotId) {
      rescheduleMutation.mutate({ id: appointmentId, newTimeSlotId: selectedSlotId }, {
        onSuccess: () => {
          const params = new URLSearchParams({
            appointmentId,
            newSlotId: selectedSlotId!,
            oldSlotId,
            doctorId: doctor.id,
            date: selectedDate!,
            mode: consultationMode!,
          }).toString();
          router.push(`/verify-otp?${params}`);
        },
        onError: () => alert("Failed to reschedule. Slot may be unavailable."),
      });
    } else {
      lockSlotMutation.mutate({ doctorId: doctor.id, slotId: selectedSlotId!, date: selectedDate ?? undefined }, {
        onSuccess: () => {
          const params = new URLSearchParams({
            doctorId: doctor.id,
            slotId: selectedSlotId!,
            date: selectedDate!,
            mode: consultationMode!,
          }).toString();
          router.push(`/verify-otp?${params}`);
        },
        onError: () => alert("Failed to reserve slot. It may be locked or booked."),
      });
    }
  };

  const consultationModeValue = doctor?.consultationMode;
  const showModeChoice = consultationModeValue === "both";

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, hsl(var(--healing-green-light)) 0%, hsl(var(--background)) 50%, hsl(var(--gold-accent-light)) 100%)",
      }}
    >
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-healing-green hover:text-healing-green/80 font-medium text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Back
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-6 sm:mb-10 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-healing-green mb-2 sm:mb-3">
            {appointmentId ? "Reschedule Appointment" : "Book Your Appointment"}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl sm:max-w-2xl mx-auto">
            Choose your preferred consultation type, date, and time to schedule with {doctor?.name}
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Doctor Info */}
          {isLoading ? (
            <div className="h-24 sm:h-28 w-full rounded-xl bg-white/60 border animate-pulse" />
          ) : error || !doctor ? (
            <p className="text-red-600">Failed to load doctor information</p>
          ) : (
            <Card className="overflow-hidden border-0 shadow-lg pt-0">
              <CardHeader className="bg-gradient-to-r from-green-200 to-green-200">
                <CardTitle className="flex items-center gap-2 text-healing-green pt-2 text-sm sm:text-base">
                  <Stethoscope className="h-6 w-4 sm:h-8 sm:w-5" /> Doctor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 bg-white flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-healing-green/10 flex items-center justify-center">
                  <User2 className="h-5 w-5 sm:h-6 sm:w-6 text-healing-green" />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <h3 className="font-semibold text-base sm:text-lg text-foreground">{doctor.name}</h3>
                  <p className="text-muted-foreground font-medium text-sm sm:text-base">{doctor.specialization}</p>
                  <Badge variant="secondary" className="text-xs sm:text-sm">{doctor.experience} years experience</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultation Type */}
          {doctor && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">Choose Consultation Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={consultationMode}
                  onValueChange={(val) => setConsultationMode(val as "online" | "in_person")}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                >
                  {showModeChoice ? (
                    <>
                      {/* Online */}
                      <Label htmlFor="online" className="cursor-pointer w-full">
                        <div className={cn(
                          "flex items-center space-x-2 sm:space-x-3 p-3 sm:p-5 h-full rounded-xl border transition-all w-full",
                          consultationMode === "online"
                            ? "border-healing-green bg-healing-green-light"
                            : "border-border hover:border-healing-green/50"
                        )}>
                          <RadioGroupItem value="online" id="online" className="custom-radio" />
                          <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Video className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm sm:text-base">Online Consultation</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">Video call from home</div>
                            </div>
                          </div>
                        </div>
                      </Label>

                      {/* In-Person */}
                      <Label htmlFor="in-person" className="cursor-pointer w-full">
                        <div className={cn(
                          "flex items-center space-x-2 sm:space-x-3 p-3 sm:p-5 h-full rounded-xl border transition-all w-full",
                          consultationMode === "in_person"
                            ? "border-healing-green bg-healing-green-light"
                            : "border-border hover:border-healing-green/50"
                        )}>
                          <RadioGroupItem value="in_person" id="in-person" className="custom-radio" />
                          <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm sm:text-base">In-Person Visit</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">Visit clinic directly</div>
                            </div>
                          </div>
                        </div>
                      </Label>
                    </>
                  ) : (
                    <div className={cn(
                      "flex items-center space-x-2 sm:space-x-3 p-3 sm:p-5 h-full rounded-xl border transition-all w-full border-healing-green bg-healing-green-light"
                    )}>
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {consultationModeValue === "online" ? <Video className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /> : <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm sm:text-base">
                            {consultationModeValue === "online" ? "Online Consultation" : "In-Person Visit"}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {consultationModeValue === "online" ? "Video call from home" : "Visit clinic directly"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

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
                    <Calendar
                      mode="single"
                      selected={selectedDate ? parseDateKey(selectedDate) : undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        const key = formatDateKey(d);
                        const isDisabled = isPastDay(d) || (!availableDates.includes(key) && key !== todayKey);
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
                  {slots.length > 0 ? (
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

          {/* Continue Button */}
          <div className="flex flex-col items-center pt-4 sm:pt-6 space-y-3 sm:space-y-4">
            <Button
              disabled={!canContinue}
              onClick={handleContinue}
              className="w-full max-w-md h-10 sm:h-12 bg-healing-green hover:bg-healing-green/90 text-white font-semibold shadow-lg text-sm sm:text-base"
            >
              Continue
            </Button>
            {!canContinue && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Please select date, time, and consultation type to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
