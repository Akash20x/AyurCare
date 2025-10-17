import { doctorApi } from "../api";

function toNameFromSlug(slug: string) {
  return slug
    .replace(/^dr[\s.-]?/i, "") // Remove 'dr' prefix
    .replace(/-/g, " ");        // Replace dashes with spaces
}

//  Server-side data fetcher for ISR usage.
export async function getDoctorBySlug(slug: string) {
  const name = toNameFromSlug(slug);

  try {
    const res = await doctorApi.getAllDoctors({ q: name });
    const doctor = res?.data?.[0];
    if (!doctor) return null;
    return doctor;
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return null;
  }
}
