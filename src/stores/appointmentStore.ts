import { Appointment } from "@/types";
import { create } from "zustand";

interface AppointmentState {
  appointments: Appointment[];
  myAppointments: Appointment[];
  selectedAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
}

interface AppointmentActions {
setSelectedAppointment: (data: Appointment | null) => void;
clearError: () => void;
setLoading: (loading: boolean) => void;
}

type AppointmentStore = AppointmentState & AppointmentActions;

export const useAppointmentStore = create<AppointmentStore>()((set) => ({
appointments: [],
myAppointments: [],
selectedAppointment: null,
isLoading: false,
error: null,

setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),
clearError: () => set({ error: null }),
setLoading: (loading) => set({ isLoading: loading }),
}));