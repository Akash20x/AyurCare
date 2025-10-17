export const formatTime12Hour = (timeStr: string, dateStr?: string) => {
  if (!timeStr) return "";

  const datePart = dateStr ? dateStr : new Date().toISOString().split("T")[0];
  return new Date(`${datePart}T${timeStr}`).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


export const formatDateLong = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


export const formatTimeOnly = (time: string) => {
    try {
        const tempDate = new Date(`1970-01-01T${time}:00`);
        return tempDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        });
    } catch {
        return time;
    }
};


export function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // "YYYY-MM-DD"
}

export function parseDateKey(key: string) {
  if (!key) return undefined;
  const k = key.slice(0, 10);
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isPastDay(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}


export const can24HoursBefore = (date?: string, time?: string) => {
  if (!date || !time) return false;
  const [datePart] = date.split("T");
  const appointmentDateTime = new Date(`${datePart}T${time}:00`);
  if (isNaN(appointmentDateTime.getTime())) return false;
  const now = new Date();
  const diffInHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffInHours >= 24;
};

export const formatDateTime = (date: string, time: string) => {
  const [datePart] = date.split("T");
  const formattedDateTime = new Date(`${datePart}T${time}:00`);
  if (isNaN(formattedDateTime.getTime())) return "Invalid Date";
  return formattedDateTime.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};