"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, Plus } from "lucide-react";
import { doctorApi } from "@/lib/api";
import { useCreateBatchTimeSlots, useCreateTimeSlots } from "@/hooks/useDoctors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDateKey(date: Date) {
  return localDateKey(date);
}

function formatDisplayDate(value: string) {
  if (!value) return "dd-mm-yyyy";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDateKey(value)).replaceAll("/", "-");
}

const today = localDateKey();
const scheduleGroups = [
  ["MON_WED_FRI", "Mon, Wed, Fri"],
  ["TUE_THU", "Tue, Thu"],
  ["TUE_THU_SAT", "Tue, Thu, Sat"],
  ["SAT_SUN", "Sat, Sun"],
  ["MON_TO_FRI", "Mon to Fri"],
  ["MON_TUE_WED", "Mon, Tue, Wed"],
  ["THU_FRI_SAT", "Thu, Fri, Sat"],
] as const;

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  const value = `${String(hour).padStart(2, "0")}:${minute}`;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return { value, label: `${displayHour}:${minute} ${period}` };
});

function formatTime(time: string) {
  const [hourText, minute = "00"] = time.split(":");
  const hour = Number(hourText);
  const period = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12}:${minute} ${period}`;
}

export function ScheduleManager({ doctorId }: { doctorId: string }) {
  const createSlots = useCreateTimeSlots();
  const createBatchSlots = useCreateBatchTimeSlots();
  const [error, setError] = useState<string | null>(null);
  const [daySchedule, setDaySchedule] = useState({ date: today, startTime: "09:00", endTime: "12:00" });
  const [weeklySchedule, setWeeklySchedule] = useState({ group: "MON_WED_FRI" as typeof scheduleGroups[number][0], startDate: today, endDate: "", startTime: "09:00", endTime: "12:00" });
  const slots = useQuery({ queryKey: ["adminAvailableSlots", doctorId, daySchedule.date], queryFn: () => doctorApi.getAvailableSlots({ doctorId, date: daySchedule.date }), enabled: Boolean(daySchedule.date), staleTime: 30_000 });
  const availableSlots = slots.data?.data ?? [];
  const visibleSlots = availableSlots.filter((slot) => {
    if (daySchedule.date !== localDateKey()) return true;
    const [hour, minute] = slot.startTime.split(":").map(Number);
    const now = new Date();
    return hour * 60 + minute > now.getHours() * 60 + now.getMinutes();
  });

  async function submitDaySchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    try {
      await createSlots.mutateAsync({ doctorId, ...daySchedule });
      await slots.refetch();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create slots."); }
  }

  async function submitWeeklySchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (!weeklySchedule.endDate) { setError("Choose an end date for the recurring schedule."); return; }
    try {
      await createBatchSlots.mutateAsync({ doctorId, scheduleType: "weekly", ...weeklySchedule });
      await slots.refetch();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create recurring slots."); }
  }

  return <div className="grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5 text-green-700" aria-hidden="true" />One-day availability</CardTitle><CardDescription>Creates 30-minute appointment slots in the selected time window.</CardDescription></CardHeader>
      <CardContent><form onSubmit={submitDaySchedule} className="grid gap-4"><DateField id="single-date" label="Date" value={daySchedule.date} onChange={(value) => setDaySchedule((current) => ({ ...current, date: value }))} min={today} /><div className="grid gap-4 sm:grid-cols-2"><TimeField id="single-start" label="Start time" value={daySchedule.startTime} onChange={(value) => setDaySchedule((current) => ({ ...current, startTime: value }))} /><TimeField id="single-end" label="End time" value={daySchedule.endTime} onChange={(value) => setDaySchedule((current) => ({ ...current, endTime: value }))} /></div><Button type="submit" className="bg-green-700 hover:bg-green-800 text-white" disabled={createSlots.isPending}>{createSlots.isPending ? "Creating…" : "Create slots"}</Button></form></CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-5 text-green-700" aria-hidden="true" />Recurring availability</CardTitle><CardDescription>Apply the same 30-minute schedule to a weekly pattern.</CardDescription></CardHeader>
      <CardContent><form onSubmit={submitWeeklySchedule} className="grid gap-4"><div className="grid gap-2"><Label htmlFor="schedule-group">Weekly pattern</Label><select id="schedule-group" value={weeklySchedule.group} onChange={(event) => setWeeklySchedule((current) => ({ ...current, group: event.target.value as typeof weeklySchedule.group }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">{scheduleGroups.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><DateField id="batch-start-date" label="Start date" value={weeklySchedule.startDate} onChange={(value) => setWeeklySchedule((current) => ({ ...current, startDate: value }))} min={today} /><DateField id="batch-end-date" label="End date" value={weeklySchedule.endDate} onChange={(value) => setWeeklySchedule((current) => ({ ...current, endDate: value }))} min={weeklySchedule.startDate} /></div><div className="grid gap-4 sm:grid-cols-2"><TimeField id="batch-start" label="Start time" value={weeklySchedule.startTime} onChange={(value) => setWeeklySchedule((current) => ({ ...current, startTime: value }))} /><TimeField id="batch-end" label="End time" value={weeklySchedule.endTime} onChange={(value) => setWeeklySchedule((current) => ({ ...current, endTime: value }))} /></div><Button type="submit" variant="outline" disabled={createBatchSlots.isPending}>{createBatchSlots.isPending ? "Creating…" : "Create recurring slots"}</Button></form></CardContent>
    </Card>
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-5 text-green-700" aria-hidden="true" />Available slots</CardTitle><CardDescription>Patient-visible availability for the selected date.</CardDescription></CardHeader>
      <CardContent>{error && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{slots.isLoading ? <div role="status" aria-label="Loading available slots" className="flex flex-wrap gap-2"><span className="sr-only">Loading available slots</span>{[1, 2, 3, 4].map((slot) => <Skeleton key={slot} className="h-9 w-32 rounded-full" />)}</div> : slots.isError ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Unable to load available slots for this date.</p> : visibleSlots.length === 0 ? <p className="text-sm text-muted-foreground">No future available slots on this date.</p> : <div className="flex flex-wrap gap-2">{visibleSlots.map((slot) => <Badge key={slot.slotId} variant="outline" className="border-green-200 bg-green-50 px-3 py-1 text-green-800"><Clock3 aria-hidden="true" />{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</Badge>)}</div>}</CardContent>
    </Card>
  </div>;
}

function DateField({ id, label, value, onChange, min }: { id: string; label: string; value: string; onChange: (value: string) => void; min: string }) {
  return <div className="grid gap-2"><Label id={`${id}-label`} className="flex w-fit items-center gap-2"><CalendarDays className="size-4 text-green-700" aria-hidden="true" />{label}</Label><Popover><PopoverTrigger asChild><Button id={id} type="button" variant="outline" aria-labelledby={`${id}-label ${id}`} className="h-9 w-full justify-start gap-2 px-3 text-left font-normal"><CalendarDays className="size-4 shrink-0" aria-hidden="true" /><span>{formatDisplayDate(value)}</span></Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={value ? parseDateKey(value) : undefined} onSelect={(date) => date && onChange(formatDateKey(date))} disabled={{ before: parseDateKey(min) }} initialFocus /></PopoverContent></Popover></div>;
}

function TimeField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="grid gap-2"><Label htmlFor={id} className="flex w-fit items-center gap-2"><Clock3 className="size-4 text-green-700" aria-hidden="true" />{label}</Label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">{timeOptions.map((time) => <option key={time.value} value={time.value}>{time.label}</option>)}</select></div>;
}
