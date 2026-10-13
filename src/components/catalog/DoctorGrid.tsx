import { Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Doctor } from "@/types";
import { DoctorCardActions } from "./DoctorCardActions";

export function DoctorGrid({ doctors, emptyMessage }: { doctors: Doctor[]; emptyMessage: string }) {
  if (doctors.length === 0) {
    return <p className="col-span-full text-center text-gray-500 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="w-full max-w-[26rem] justify-self-center rounded-xl border border-gray-200 shadow-sm bg-white">
          <CardHeader className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-lg">
              {doctor.name.replace(/^Dr\.?\s*/i, "").split(" ").map((word) => word[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-gray-900">{doctor.name}</CardTitle>
              <CardDescription className="text-sm text-gray-600">{doctor.specialization}</CardDescription>
              <p className="text-xs text-gray-500 mt-1">{doctor.experience} yrs experience</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctor.bio && <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-lg shadow-sm"><p className="text-sm text-emerald-800 leading-relaxed">{doctor.bio}</p></div>}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-3 py-1.5 rounded-md border text-sm font-semibold text-emerald-700 bg-emerald-50">In-person</div>
                {doctor.consultationFee !== undefined && <div className="flex items-center overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 text-sm"><span className="px-2 py-1.5 font-semibold text-emerald-700">Consultation fee</span><span className="border-l border-emerald-200 bg-white/60 px-2 py-1.5 font-semibold text-emerald-700">₹{doctor.consultationFee}</span></div>}
              </div>
              {doctor.city && <div className="flex items-center gap-2 pt-1 text-sm font-medium leading-none text-gray-700"><MapPin className="h-4 w-4 text-emerald-600" /><span>{doctor.city}</span></div>}
              {doctor.clinicName && <div className="flex items-center gap-2 text-sm font-medium leading-none text-gray-700"><Building2 className="h-4 w-4 text-emerald-600" /><span>{doctor.clinicName}</span></div>}
            </div>
            <DoctorCardActions doctor={doctor} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
