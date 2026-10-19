"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const patientsQuery = useQuery({ queryKey: ["adminPatients", page], queryFn: () => adminApi.patients(page) });
  const patients = patientsQuery.data?.data ?? [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6"><h1 className="text-3xl font-bold">Patients</h1><p className="mt-2 text-muted-foreground">Newest registered patient accounts first.</p></div>
      {patientsQuery.isLoading ? <AdminTableSkeleton label="Loading patients" /> : <div className="overflow-hidden rounded-2xl border border-green-100 dark:border-green-900/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="bg-green-50 text-xs uppercase tracking-wide text-green-900 dark:bg-green-950/30 dark:text-green-100">
              <tr>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Patient</th>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Email</th>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Phone</th>
                <th className="border-r border-green-100 px-5 py-3 align-middle font-semibold dark:border-green-900/40">Joined</th>
                <th className="px-5 py-3 align-middle text-right font-semibold">Appointments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50 text-sm font-normal text-slate-700 dark:divide-green-900/40 dark:text-slate-300">
              {patients.map((patient) => (
                <tr key={patient.id} className="h-12 transition-colors hover:bg-green-100/70 dark:hover:bg-green-900/50">
                  <td className="px-5 py-1 align-middle">{patient.name}</td>
                  <td className="px-5 py-1 align-middle">{patient.email}</td>
                  <td className="px-5 py-1 align-middle">{patient.phone || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-1 align-middle">{formatDate(patient.createdAt)}</td>
                  <td className="px-5 py-1 align-middle text-right">
                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
                      <Link href={`/admin/patients/${patient.id}`}>History <ArrowUpRight className="size-3 sm:size-4" aria-hidden="true" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {!patients.length && (
                <tr>
                  <td colSpan={5} className="h-28 text-center text-muted-foreground">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}
      {patientsQuery.data?.hasMore && <Button className="mt-5" variant="outline" onClick={() => setPage(page + 1)}>Load more</Button>}
    </main>
  );
}
