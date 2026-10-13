"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toSlug } from "@/lib/helpers/stringHelpers";
import { useDoctorStore } from "@/stores/doctorStore";
import type { Doctor } from "@/types";

export function DoctorCardActions({ doctor }: { doctor: Doctor }) {
  const router = useRouter();
  const setSelectedDoctor = useDoctorStore((state) => state.setSelectedDoctor);
  const slug = toSlug(doctor.name);

  return (
    <div className="flex gap-2 pt-2">
      <Button
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
        onClick={() => {
          setSelectedDoctor(doctor);
          router.push(`/doctor/${slug}/book`);
        }}
      >
        Book Now
      </Button>
      <Button
        className="flex-1 cursor-pointer"
        variant="outline"
        onClick={() => router.push(`/doctor/${slug}`)}
      >
        View Profile
      </Button>
    </div>
  );
}
