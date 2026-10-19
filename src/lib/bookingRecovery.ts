const BOOKING_RECOVERY_KEY = "ayurcare:booking-recovery";

type BookingRecoveryContext = { doctorSlug: string };

function hasSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function saveBookingRecoveryContext(context: BookingRecoveryContext) {
  if (!hasSessionStorage() || !context.doctorSlug) return;
  sessionStorage.setItem(BOOKING_RECOVERY_KEY, JSON.stringify(context));
}

export function getBookingRecoveryContext(): BookingRecoveryContext | null {
  if (!hasSessionStorage()) return null;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(BOOKING_RECOVERY_KEY) || "null");
    if (!value || typeof value !== "object" || !("doctorSlug" in value) || typeof value.doctorSlug !== "string") return null;
    return { doctorSlug: value.doctorSlug };
  } catch {
    return null;
  }
}

export function clearBookingRecoveryContext() {
  if (hasSessionStorage()) sessionStorage.removeItem(BOOKING_RECOVERY_KEY);
}
