"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SPECIALIZATIONS } from "@/lib/specializations";
import { Input } from "@/components/ui/input";
import { useDoctors } from "@/hooks";
import { useDoctorStore } from "@/stores/doctorStore";
import { ScrollableFilter } from "@/components/shared/ScrollableFilter";
import { DoctorFilter } from "@/types";
import { useMemo } from "react";
import { toSlug } from "@/lib/helpers/stringHelpers";

export default function Home() {
  const { selectedSpeciality, setSpeciality, setSelectedDoctor } = useDoctorStore();

  const filter: DoctorFilter = useMemo(() => {
    const f: DoctorFilter = {};
    if (selectedSpeciality) f.specialization = selectedSpeciality;
    return f;
  }, [selectedSpeciality]);

  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctors(filter);
  const router = useRouter();

  const doctors = doctorsData?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="text-center my-8">
        <h2 className="text-3xl md:text-4xl font-bold text-healing-green mb-4">
          Find Your Ayurvedic Doctor
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our network of certified Ayurvedic practitioners and book consultations 
          based on your health needs and preferences.
        </p>
      </div>

      <div className="mx-auto max-w-6xl space-y-10">
        <div className="w-full text-center space-y-6">
          <div className="mx-auto max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const data = new FormData(form);
                const term = String(data.get("q") || "").trim();
                router.push(`/explore${term ? `?q=${encodeURIComponent(term)}` : ""}`);
              }}
              className="flex items-center gap-2 flex-col sm:flex-row"
            >
              {/* Search Input */}
              <Input
                name="q"
                placeholder="Search doctors by name, specialization, or bio"
                className="flex-1 bg-white border border-green-600 focus:border-emerald-400 focus:ring-emerald-400 shadow-sm px-4 py-2 text-gray-700 placeholder-gray-400"
              />

              {/* Search Button */}
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 cursor-pointer text-white font-medium rounded-md my-2 sm:my-0 px-20 sm:px-5 py-2 shadow-sm transition duration-200"
              >
                Search
              </Button>
            </form>
          </div>
        </div>

        <section className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-green-700">Our Doctors</h2>
            {/* Optional: search or filter actions can be added here */}
          </div>

          {/* Specialization Filter */}
          <ScrollableFilter
            items={SPECIALIZATIONS.map((s) => s.value)}
            selected={selectedSpeciality}
            onSelect={(value) =>
              setSpeciality(value === selectedSpeciality ? null : value)
            }
          />

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingDoctors ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-52 rounded-xl bg-white/60 border border-gray-200 animate-pulse shadow-sm"
                />
              ))
            ) : doctors.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 text-sm">
                No doctors available.
              </p>
            ) : (
              doctors.slice(0, 6).map((doc) => (
                <Card
                  key={doc.id}
                  className="rounded-xl border border-gray-200 shadow-sm bg-white"
                >
                  <CardHeader className="flex items-start gap-3">
                    {/* Initials Badge */}
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-lg">
                      {doc.name
                        .replace(/^Dr\.?\s*/i, "")
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {doc.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {doc.specialization}
                      </CardDescription>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.experience} yrs experience
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {doc.bio && (
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-emerald-800 leading-relaxed">{doc.bio}</p>
                      </div>
                    )}

                    {/* Mode Chips */}
                    <div className="flex flex-wrap gap-2">
                      {(doc.consultationMode === "both" ||
                        doc.consultationMode === "online") && (
                        <div className="px-3 py-1.5 rounded-md border text-sm font-semibold text-emerald-700 bg-emerald-50">
                          Online
                        </div>
                      )}
                      {(doc.consultationMode === "both" ||
                        doc.consultationMode === "in_person") && (
                        <div className="px-3 py-1.5 rounded-md border text-sm font-semibold text-emerald-700 bg-emerald-50">
                          In-person
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        onClick={() => {
                          setSelectedDoctor(doc);
                          router.push(`/doctor/${toSlug(doc.name)}/book`);
                        }}
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
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
