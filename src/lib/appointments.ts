import { Appointment } from "@/types";

export function getNextAppointment(appointments: Appointment[] = []): Appointment | null {
  if (!appointments.length) return null;

  const now = new Date();

  // Filter only future appointments with status BOOKED
  const upcoming = appointments.filter(a => {
    if (a.status !== "BOOKED") return false;

    const appointmentDate = a.timeSlot.date.split("T")[0];
    const appointmentDateTime = new Date(`${appointmentDate}T${a.timeSlot.startTime}:00`);

    return appointmentDateTime > now;
  });

  if (!upcoming.length) return null;

  // Sort by date/time and pick the earliest
  upcoming.sort((a, b) => {
    const dateA = new Date(a.timeSlot.date.split("T")[0] + `T${a.timeSlot.startTime}:00`).getTime();
    const dateB = new Date(b.timeSlot.date.split("T")[0] + `T${b.timeSlot.startTime}:00`).getTime();
    return dateA - dateB;
  });

  return upcoming[0];
}
