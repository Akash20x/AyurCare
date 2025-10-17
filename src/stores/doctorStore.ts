import { Doctor, DoctorFilter } from "@/types";
import { create } from "zustand";


interface DoctorState {
doctors: Doctor[];
selectedDoctor: Doctor | null;
selectedSpeciality: string | null;
selectedDate: string | null;
selectedSlotId: string | null;
consultationMode: "online" | "in_person" | null;
isLoading: boolean;
error: string | null;
doctorFilter: DoctorFilter | null;
}


interface DoctorActions {
setSelectedDoctor: (data: Doctor | null) => void;
setSpeciality: (speciality: string | null) => void;
setSelectedDate: (date: string | null) => void;
setSelectedSlotId: (slotId: string | null) => void;
setConsultationMode: (mode: "online" | "in_person" | null) => void;
clearError: () => void;
setLoading: (loading: boolean) => void;
resetDoctorState: () => void;
}


type DoctorStore = DoctorState & DoctorActions;


export const useDoctorStore = create<DoctorStore>()((set) => ({
doctors: [],
selectedDoctor: null,
selectedSpeciality: null,
selectedDate: null,
selectedSlotId: null,
consultationMode: null,
isLoading: false,
error: null,
doctorFilter: null,


setSpeciality: (speciality) => set({ selectedSpeciality: speciality }),
setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
setSelectedDate: (date) => set({ selectedDate: date }),
setSelectedSlotId: (slotId) => set({ selectedSlotId: slotId }),
setConsultationMode: (mode) => set({ consultationMode: mode }),
clearError: () => set({ error: null }),
setLoading: (loading) => set({ isLoading: loading }),
resetDoctorState: () =>
set({ selectedDoctor: null, selectedSpeciality: null, selectedDate: null, selectedSlotId: null, consultationMode: null }),
}));