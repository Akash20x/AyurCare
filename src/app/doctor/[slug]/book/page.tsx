import { notFound } from "next/navigation";
import { AppLink } from "@/components/shared/AppLink";
import { ArrowLeft } from "lucide-react";
import BookAppointmentClient from "./BookAppointmentClient";
import { getDoctorBySlug } from "@/lib/server/doctorCatalog";

export default async function BookAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ appointmentId?: string; oldSlotId?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!slug) notFound();

  const result = await getDoctorBySlug(slug);
  if (result.error) throw new Error(result.error);
  if (!result.data) notFound();

  const isRescheduling = Boolean(query.appointmentId && query.oldSlotId);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, hsl(var(--healing-green-light)) 0%, hsl(var(--background)) 50%, hsl(var(--gold-accent-light)) 100%)",
      }}
    >
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <AppLink
          href={`/doctor/${slug}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-green-800 hover:text-green-900 sm:mb-6 sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          Back
        </AppLink>

        <div className="mb-6 px-2 text-center sm:mb-10">
          <h1 className="mb-2 text-2xl font-bold text-green-800 sm:mb-3 sm:text-3xl md:text-4xl">
            {isRescheduling ? "Reschedule Appointment" : "Book Your Appointment"}
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:max-w-2xl sm:text-base md:text-lg">
            Choose an available date and time for your in-person visit with {result.data.name}
          </p>
        </div>

        <BookAppointmentClient doctor={result.data} slug={slug} />
      </div>
    </div>
  );
}
