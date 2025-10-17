import { notFound } from "next/navigation";
import { Calendar, Video, MapPin, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDoctorBySlug } from "@/lib/data/doctors";
import { getInitials, toSlug } from "@/lib/helpers/stringHelpers";

export const revalidate = 60;

export default async function DoctorProfilePage(
  props: { params: Promise<{ slug: string }> } 
) {
  const { slug } = await props.params; 

  const doctor = await getDoctorBySlug(slug);
  if (!doctor) return notFound();

  const initials = getInitials(doctor.name); 

  return (
    <div className="min-h-screen bg-[#fafaf8] p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <a
          href="/explore"
          className="mb-4 inline-block text-emerald-700 hover:underline text-sm"
        >
          ← Back to Doctors
        </a>

        <Card className="flex flex-col md:flex-row justify-between items-start p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 gap-6 md:gap-8">
          {/* Left Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
            <div
              className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full bg-emerald-100 flex items-center justify-center
                         text-2xl sm:text-2xl md:text-3xl font-semibold text-emerald-700 border-2 border-emerald-200 flex-shrink-0"
            >
              {initials}
            </div>

            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-800">
                {doctor.name}
              </h2>
              <p className="text-md sm:text-lg text-amber-800 mt-1">{doctor.specialization}</p>

              <p className="text-gray-700 mt-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-gold-accent" />
                <span className="font-medium">
                  {doctor.experience} years experience
                </span>
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {(doctor.consultationMode?.toLowerCase().includes("online") ||
                  doctor.consultationMode?.toLowerCase() === "both") && (
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    <Video size={16} /> Online
                  </span>
                )}

                {(doctor.consultationMode?.toLowerCase().includes("in-person") ||
                  doctor.consultationMode?.toLowerCase() === "both") && (
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    <MapPin size={16} /> In-person
                  </span>
                )}
              </div>

              {doctor.bio && (
                <p className="text-gray-600 mt-4 max-w-full md:max-w-lg">{doctor.bio}</p>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="w-full md:w-64 mt-6 md:mt-0 md:ml-4 flex-shrink-0">
            <div className="rounded-xl border border-gray-200 p-4 sm:p-5 text-center w-full">
              <Button
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2"
                asChild
              >
                <a href={`/doctor/${toSlug(doctor.name)}/book`}>
                  <Calendar size={18} /> Book Appointment
                </a>
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
