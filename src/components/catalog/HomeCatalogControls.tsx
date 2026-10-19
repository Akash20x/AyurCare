"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollableFilter } from "@/components/shared/ScrollableFilter";
import { SPECIALIZATIONS } from "@/lib/specializations";

export function HomeCatalogControls({ selectedSpecialization }: { selectedSpecialization?: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const updateSpecialization = (specialization: string | null) => {
    const searchParams = new URLSearchParams();
    if (specialization) searchParams.set("specialization", specialization);
    startTransition(() => router.replace(`/${searchParams.size ? `?${searchParams}` : ""}`));
  };

  return (
    <>
      <div className="w-full text-center space-y-6">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={(event) => { event.preventDefault(); const term = String(new FormData(event.currentTarget).get("q") || "").trim(); router.push(`/explore${term ? `?q=${encodeURIComponent(term)}` : ""}`); }} className="flex items-center gap-2 flex-col sm:flex-row">
            <Input name="q" placeholder="Search doctors by name, specialization, or bio" className="flex-1 bg-white border border-green-600 focus:border-emerald-700 focus:ring-emerald-700 shadow-sm px-4 py-2 text-gray-700 placeholder-gray-500" />
            <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 cursor-pointer text-white font-medium rounded-md my-2 sm:my-0 px-20 sm:px-5 py-2 shadow-sm transition duration-200">Search</Button>
          </form>
        </div>
      </div>
      <ScrollableFilter items={SPECIALIZATIONS.map((specialization) => specialization.value)} selected={selectedSpecialization ?? null} onSelect={(value) => updateSpecialization(value === selectedSpecialization ? null : value)} />
    </>
  );
}
