"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Stethoscope, CalendarDays, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminHomePage() {
  const stats = useQuery({ queryKey: ["adminStats"], queryFn: adminApi.stats });
  const values = stats.data?.data;

  return (
    <main className="max-w-none px-4 py-6 sm:px-6 lg:px-8 sm:py-7">
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Admin workspace</h1>
      </div>
      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Statistics">
        <Stat icon={<Users />} label="Total Users" value={values?.totalUsers} loading={stats.isLoading} />
        <Stat icon={<CalendarDays />} label="Total Appointments" value={values?.totalAppointments} loading={stats.isLoading} />
        <Stat icon={<Stethoscope />} label="Total Doctors" value={values?.totalDoctors} loading={stats.isLoading} />
      </section>
      <section className="grid gap-4 md:grid-cols-3" aria-label="Administration tasks">
        <AdminAction
          icon={<Stethoscope />}
          title="Doctor directory"
          description="Create profiles and keep clinic details, fees, and expertise current."
          href="/admin/doctors"
        />
        <AdminAction
          icon={<CalendarDays />}
          title="Today’s Appointments"
          description="Review all patient consultations scheduled today."
          href="/admin/appointments"
        />
        <AdminAction
          icon={<Users />}
          title="Patients"
          description="Browse registered patients and their appointment history."
          href="/admin/patients"
        />
      </section>
    </main>
  );
}
function Stat({
  icon,
  label,
  value,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <Card className="h-28 min-h-0 gap-0 overflow-hidden rounded-xl border border-green-100 bg-gradient-to-br from-green-50 via-emerald-50 to-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-green-900/60 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-background">
      <CardContent className="flex h-full flex-col justify-between p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">{label}</p>
          <div className="flex size-8 items-center justify-center rounded-lg bg-white text-green-700 shadow-sm ring-1 ring-green-100 dark:bg-green-900/50 dark:ring-green-800" aria-hidden="true">
            {icon}
          </div>
        </div>
        {loading ? <Skeleton className="h-8 w-12 bg-green-100 dark:bg-green-900/60" /> : <p className="text-2xl font-bold tracking-tight text-green-950 dark:text-green-50">{value ?? 0}</p>}
      </CardContent>
    </Card>
  );
}

function AdminAction({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block h-36 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">
      <Card className="h-full cursor-pointer gap-0 overflow-hidden border-green-100 !py-0 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-green-300 group-hover:bg-green-50/70 group-hover:shadow-md dark:border-green-900/60 dark:group-hover:border-green-700 dark:group-hover:bg-green-950/20">
        <CardContent className="flex h-full items-center gap-4 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 ring-1 ring-green-100 transition-colors group-hover:bg-green-100 dark:bg-green-900/40 dark:ring-green-800 dark:group-hover:bg-green-900/70" aria-hidden="true">
            <span className="[&>svg]:size-5">{icon}</span>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
