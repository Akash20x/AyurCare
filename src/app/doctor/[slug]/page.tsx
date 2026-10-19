import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Award, Building2, Languages } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDoctorBySlug } from "@/lib/server/doctorCatalog";
import { getInitials, toSlug } from "@/lib/helpers";

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; 

  if (!slug) return notFound();  

  const result = await getDoctorBySlug(slug);
  if (result.error) {
    return <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-6 text-red-600">{result.error}</div>;
  }

  const doctor = result.data;
  if (!doctor) return notFound();

  const initials = getInitials(doctor.name); 
  const languages = doctor.languages?.filter(Boolean).join(", ") || "Languages not specified";

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#fafaf8] p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/explore"
          className="mb-4 inline-block text-emerald-700 hover:underline text-sm"
        >
          ← Back to Doctors
        </Link>

        <Card className="grid grid-cols-1 items-start gap-6 rounded-2xl border border-gray-200 p-4 shadow-sm sm:p-6 md:grid-cols-[auto_minmax(0,1fr)_16rem] md:gap-x-6 md:gap-y-0 md:p-8 lg:grid-cols-[auto_minmax(0,1fr)_20rem] lg:gap-x-8">
          <div
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-100 text-2xl font-semibold text-emerald-700 md:mt-3 md:h-32 md:w-32 md:self-start md:text-3xl"
          >
            {initials}
          </div>

          <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-800">
                {doctor.name}
              </h1>
              <p className="text-md sm:text-lg text-amber-800 mt-1">{doctor.specialization}</p>

              <p className="mt-2 flex flex-wrap items-center gap-2 text-gray-700">
                <Award className="h-5 w-5 text-gold-accent" />
                <span className="font-medium">
                  {doctor.experience} years experience
                </span>
                <span className="text-gray-300" aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Languages className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span className="font-medium">{languages}</span>
                </span>
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  <MapPin size={16} /> In-person
                </span>

                {doctor.consultationFee !== undefined && (
                  <span className="inline-flex overflow-hidden rounded-full border border-emerald-100 text-sm">
                    <span className="bg-white px-2.5 py-1 font-semibold text-emerald-700">Consultation fee</span>
                    <span className="border-l border-emerald-100 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                      ₹{doctor.consultationFee}
                    </span>
                  </span>
                )}
              </div>

              {doctor.bio && (
                <p className="text-gray-600 mt-4 max-w-full md:max-w-lg">{doctor.bio}</p>
              )}

              <dl className="mt-5 grid max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {doctor.clinicName && (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-stone-50 px-3 py-2.5">
                      <Building2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                      <div className="min-w-0">
                        <dt className="text-xs text-gray-500">Clinic</dt>
                        <dd className="truncate text-sm font-medium text-gray-800">{doctor.clinicName}</dd>
                      </div>
                    </div>
                  )}
                  {doctor.city && (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-stone-50 px-3 py-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                      <div className="min-w-0">
                        <dt className="text-xs text-gray-500">Location</dt>
                        <dd className="truncate text-sm font-medium text-gray-800">{doctor.city}</dd>
                      </div>
                    </div>
                  )}
              </dl>
          </div>

          <div className="w-full self-center md:col-start-3 md:row-start-1">
            <div className="rounded-xl border border-gray-200 p-4 sm:p-5 text-center w-full">
              <Button
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2"
                asChild
              >
                <Link href={`/doctor/${toSlug(doctor.name)}/book`}>
                  <Calendar size={18} /> Book Appointment
                </Link>
              </Button>
              <p className="text-gray-600 text-sm mt-3">
                Schedule your consultation today
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
