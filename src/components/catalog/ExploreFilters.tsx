"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Toggle } from "@/components/ui/toggle";
import { SPECIALIZATIONS } from "@/lib/specializations";
import type { DoctorQuery } from "@/types";

function buildExploreUrl(filter: DoctorQuery) {
  const searchParams = new URLSearchParams();
  if (filter.q) searchParams.set("q", filter.q);
  if (filter.specialization) searchParams.set("specialization", filter.specialization);
  if (filter.earliestAvailable === "earliest") searchParams.set("available", "earliest");
  return `/explore${searchParams.size ? `?${searchParams}` : ""}`;
}

export function ExploreFilters({ initialFilter }: { initialFilter: DoctorQuery }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialFilter.q || "");
  const [specializations, setSpecializations] = useState<string[]>(initialFilter.specialization ? [initialFilter.specialization] : []);
  const [earliestAvailable, setEarliestAvailable] = useState(initialFilter.earliestAvailable === "earliest");
  const hasFilters = Boolean(q || specializations.length || earliestAvailable);
  const applyFilters = () => startTransition(() => router.replace(buildExploreUrl({ q: q.trim() || undefined, specialization: specializations[0], earliestAvailable: earliestAvailable ? "earliest" : undefined })));

  return (
    <form onSubmit={(event) => { event.preventDefault(); applyFilters(); }} className="grid grid-cols-1 gap-3 items-end md:flex md:flex-wrap md:items-end md:gap-4">
      <div className="flex-1 min-w-[250px]"><label className="mb-1 block text-sm text-gray-700">Search</label><div className="flex items-center rounded-lg border bg-white overflow-hidden shadow-sm"><Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search by name, specialization, or bio" className="border-0 focus-visible:ring-0 focus:outline-none px-3 py-2 flex-1" /><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 rounded-none px-5 flex items-center justify-center">🔍</Button></div></div>
      <div className="min-w-[200px]"><label className="mb-1 block text-sm text-gray-700">Specialization</label><Dropdown options={SPECIALIZATIONS.map((specialization) => ({ value: specialization.value, label: specialization.value }))} selectedValues={specializations} onChange={(values) => setSpecializations(values.length ? [values[values.length - 1]] : [])} placeholder="Select specialization" /></div>
      <div className="min-w-[150px]"><label className="mb-1 block text-sm text-gray-700">Availability</label><Toggle checked={earliestAvailable} onCheckedChange={setEarliestAvailable} className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">Earliest Available</Toggle></div>
      <div className="w-full flex gap-2 mt-2 md:mt-0"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Apply</Button>{hasFilters && <Button type="button" variant="outline" onClick={() => { setQ(""); setSpecializations([]); setEarliestAvailable(false); startTransition(() => router.replace("/explore")); }}>Reset</Button>}</div>
    </form>
  );
}
