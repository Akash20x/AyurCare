"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent, 
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SPECIALIZATIONS } from "@/lib/specializations";
import { Dropdown } from "@/components/ui/dropdown";
import { Toggle } from "@/components/ui/toggle";
import { ConsultationMode, Doctor, DoctorQuery } from "@/types";
import { useDoctors } from "@/hooks";

export default function ExplorePageClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") || "");
  const [consultationModes, setConsultationModes] = useState<string[]>(
    params.get("consultation_mode") ? [params.get("consultation_mode")!] : []
  );
  const [specializations, setSpecializations] = useState<string[]>(
    params.get("specialization") ? [params.get("specialization")!] : []
  );
  const [earliestAvailable, setEarliestAvailable] = useState<boolean>(
    params.get("available") === "earliest"
  );

  const filter: DoctorQuery = useMemo(() => {
    const f: DoctorQuery = {};
    if (q) f.q = q;
    if (consultationModes[0])
      f.consultationMode = consultationModes[0] as ConsultationMode;
    if (specializations[0]) f.specialization = specializations[0];
    if (earliestAvailable) f.earliestAvailable = "earliest";
    return f;
  }, [q, consultationModes, specializations, earliestAvailable]);

  const [appliedFilter, setAppliedFilter] = useState<DoctorQuery>({});
  const { data: doctorsData, isLoading, refetch } = useDoctors(appliedFilter, {
    enabled: false,
  });
  const doctors = doctorsData?.data || [];

  const hasFilters = useMemo(
    () => Boolean(q || consultationModes.length || specializations.length || earliestAvailable),
    [q, consultationModes, specializations, earliestAvailable]
  );

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilter(filter);
    if (q) {
      router.replace(`/explore?q=${encodeURIComponent(q)}`);
    }
  };

  useEffect(() => {
    if (
      params.get("q") ||
      params.get("consultation_mode") ||
      params.get("specialization") ||
      params.get("available")
    ) {
      setAppliedFilter(filter);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [appliedFilter, refetch]);

  const resetFilters = () => {
    setQ("");
    setConsultationModes([]);
    setSpecializations([]);
    setEarliestAvailable(false);
    setAppliedFilter({});
    refetch();
    router.replace("/explore");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold text-green-700">Explore Doctors</h1>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-3 items-end md:flex md:flex-wrap md:items-end md:gap-4"
        >
          {/* Search Box */}
          <div className="flex-1 min-w-[250px]">
            <label className="mb-1 block text-sm text-gray-700">Search</label>
            <div className="flex items-center rounded-lg border bg-white overflow-hidden shadow-sm">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, specialization, or bio"
                className="border-0 focus-visible:ring-0 focus:outline-none px-3 py-2 flex-1"
              />
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 rounded-none px-5 flex items-center justify-center"
              >
                🔍
              </Button>
            </div>
          </div>

          {/* Consultation Mode */}
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm text-gray-700">Consultation Mode</label>
            <Dropdown
              options={[
                { value: "online", label: "Online" },
                { value: "in_person", label: "In-person" },
                { value: "both", label: "Both" },
              ]}
              selectedValues={consultationModes}
              onChange={(values) =>
                setConsultationModes(values.length ? [values[values.length - 1]] : [])
              }
              placeholder="Select consultation mode"
            />
          </div>

          {/* Specialization */}
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm text-gray-700">Specialization</label>
            <Dropdown
              options={SPECIALIZATIONS.map((s) => ({ value: s.value, label: s.value }))}
              selectedValues={specializations}
              onChange={(values) =>
                setSpecializations(values.length ? [values[values.length - 1]] : [])
              }
              placeholder="Select specialization"
            />
          </div>

          {/* Availability */}
          <div className="min-w-[150px]">
            <label className="mb-1 block text-sm text-gray-700">Availability</label>
            <Toggle
              checked={earliestAvailable}
              onCheckedChange={setEarliestAvailable}
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              Earliest Available
            </Toggle>
          </div>

          {/* Buttons */}
          <div className="w-full flex gap-2 mt-2 md:mt-0">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Apply
            </Button>
            {hasFilters && (
              <Button type="button" variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-48 rounded-xl bg-white/60 border animate-pulse" />
              ))
            : doctors.length === 0
            ? <p className="text-center text-muted-foreground col-span-full">No results.</p>
            : doctors.map((doc: Doctor) => (
                <Card key={doc.id} className="rounded-xl border border-gray-200 shadow-sm bg-white">
                  <CardHeader className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-lg">
                      {doc.name.replace(/^Dr\.?\s*/i, "").split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-gray-900">{doc.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">{doc.specialization}</CardDescription>
                      <p className="text-xs text-gray-500 mt-1">{doc.experience} yrs experience</p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {doc.bio && (
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-emerald-800 leading-relaxed">{doc.bio}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {(doc.consultationMode === "both" || doc.consultationMode === "online") && (
                        <div className="px-3 py-1.5 rounded-md border text-sm font-semibold text-emerald-700 bg-emerald-50">Online</div>
                      )}
                      {(doc.consultationMode === "both" || doc.consultationMode === "in_person") && (
                        <div className="px-3 py-1.5 rounded-md border text-sm font-semibold text-emerald-700 bg-emerald-50">In-person</div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        onClick={() => router.push(`/doctor/${toSlug(doc.name)}/book`)}
                      >
                        Book Now
                      </Button>
                      <Button
                        className="flex-1 cursor-pointer"
                        variant="outline"
                        onClick={() => router.push(`/doctor/${toSlug(doc.name)}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}
