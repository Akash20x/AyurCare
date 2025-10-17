
export type ConsultationMode = 'online' | 'in_person' | 'both';

export type Doctor = {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  specialization: string;
  consultationMode: ConsultationMode;
  experience: number;
  fees?: number;
  bio?: string | null;
  imageUrl?: string | null;
};

export type TimeSlot = {
  id: string;
  date?: string;
  startTime: string;
  endTime: string;
  doctorId?: string;
};


export interface User {
  id: string;
  name: string;
  email: string;
}

export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    specialization: string;
    imageUrl: string;
  };
  timeSlot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

export type SlotStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export type AvailableSlot = {
  slotId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
};

export enum UserRole {
  PATIENT = "patient",
  ADMIN = "admin",
}

export interface Token {
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}


export interface DoctorFilter {
  specialization?: string;
  consultationMode?: ConsultationMode;
  earliestAvailable?: string;
}

export interface DoctorQuery extends DoctorFilter {
  q?: string;
  limit?: number;
}

export interface ApiError {
  status?: number;
  message?: string;
}

export interface SlotsAvailabilityFilter {
  date: Date;
}

export interface SlotFilter {
 doctorId: string,
date?: string;      
  start?: string;
  end?: string;
}

export type LockSlotInput = {
  doctorId: string;
  slotId: string;
  date?: string; // <-- ADD THIS

};

export type LockApiResponse = {
  timeSlotId: string;
  doctorId: string;
  lockedBy: string;
  lockedAt: string;        
  lockExpires: string;    
  date: string;
  startTime: string;
};

export type LockSlotData = {
  slotId: string;
  doctorId: string;
  lockedBy: string;
  expiresAt: string; 
};

