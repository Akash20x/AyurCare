// Shared primitives
export type ConsultationMode = 'in_person';
export type ScheduleGroup =
  | 'MON_WED_FRI'
  | 'TUE_THU'
  | 'TUE_THU_SAT'
  | 'SAT_SUN'
  | 'MON_TO_FRI'
  | 'MON_TUE_WED'
  | 'THU_FRI_SAT';

// Doctor catalog
export type Doctor = {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  specialization: string;
  consultationMode: ConsultationMode;
  experience: number;
  consultationFee?: number;
  languages?: string[];
  clinicName?: string | null;
  city?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
};

export type DoctorInput = {
  name: string;
  email: string;
  phone?: string | null;
  specialization: string;
  consultationFee: number;
  languages: string[];
  clinicName?: string | null;
  city?: string | null;
  experience: number;
  bio?: string | null;
  imageUrl?: string | null;
};

export interface DoctorFilter {
  specialization?: string;
  consultationMode?: ConsultationMode;
  earliestAvailable?: string;
}

export interface DoctorQuery extends DoctorFilter {
  q?: string;
  limit?: number;
  page?: number;
}

export interface PaginatedDoctorResponse extends ApiResponse<Doctor[]> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
}

// User and authentication
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: 'user' | 'admin';
  createdAt?: string;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export type EmailDeliveryStatus = 'sent' | 'disabled' | 'failed';

export type OtpSendResult = {
  email: string;
  expiresInMinutes: number;
  emailDelivery: 'sent' | 'disabled';
};

export type OtpVerificationResult = {
  email: string;
  verifiedUntil: string;
};

// Appointments and booking
export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export type AppointmentDoctor = {
  id: string;
  name: string;
  specialization: string;
  imageUrl: string | null;
};

export type AppointmentTimeSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  notes: string | null;
  contactEmail: string | null;
  consultationMode: ConsultationMode | null;
  consultationFee: number | null;
  patientName: string | null;
  patientAge: number | null;
  patientGender: string | null;
  patientPhone: string | null;
  createdAt: string;
  updatedAt?: string;
  emailDelivery?: EmailDeliveryStatus;
  doctor: AppointmentDoctor;
  timeSlot: AppointmentTimeSlot | null;
}

export type AppointmentListItem = Pick<
  Appointment,
  'id' | 'status' | 'contactEmail' | 'consultationFee' | 'patientName'
> & {
  doctor: Pick<AppointmentDoctor, 'name' | 'specialization'>;
  timeSlot: Pick<AppointmentTimeSlot, 'date' | 'startTime' | 'endTime'> | null;
};

export type AppointmentDetails = Pick<
  Appointment,
  | 'id'
  | 'status'
  | 'notes'
  | 'contactEmail'
  | 'consultationFee'
  | 'patientName'
  | 'patientAge'
  | 'patientGender'
  | 'patientPhone'
> & {
  doctor: Pick<AppointmentDoctor, 'name' | 'specialization'>;
  timeSlot: AppointmentTimeSlot | null;
};

export type AppointmentMutationResult = Pick<Appointment, 'id' | 'status'>;

export type PatientGender = 'male' | 'female' | 'other';

export type BookingPatient = {
  name: string;
  age?: number;
  gender?: PatientGender;
  phone?: string;
};

export type CreateBookingDraftInput = {
  doctorId: string;
  timeSlotId: string;
  contactEmail: string;
  bookingForSomeoneElse: boolean;
  patient: BookingPatient;
};

export type BookingDraft = {
  doctorId: string;
  timeSlotId: string;
  contactEmail: string;
  patient?: BookingPatient | null;
};

export type BookingDraftOtpSendResult = {
  expiresInMinutes: number;
  emailDelivery: 'sent' | 'disabled';
};

export type BookingDraftOtpVerificationResult = {
  verifiedUntil: string;
};

export type BookingConfirmationSummary = {
  doctor: Pick<Doctor, 'name' | 'specialization' | 'consultationFee'> & {
    venue: string | null;
  };
  appointment: Pick<AppointmentTimeSlot, 'date' | 'startTime' | 'endTime'>;
  patient: {
    name: string | null;
    age: number | null;
    gender: BookingPatient['gender'] | null;
    phone: string | null;
    email: string;
  };
};

// Scheduling and slots
export type SlotStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export type CreateTimeSlotsInput = {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type CreateBatchTimeSlotsInput = {
  doctorId: string;
  scheduleType: 'weekly';
  group: ScheduleGroup;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

export type AvailableSlot = {
  slotId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
};

export interface SlotFilter {
  doctorId: string;
  date?: string;
  start?: string;
  end?: string;
}

export type LockSlotInput = {
  doctorId: string;
  slotId: string;
  date?: string;
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

export type RescheduleLockResponse = {
  lock: LockApiResponse;
  oldSlotId: string;
};

export type LockSlotData = {
  slotId: string;
  doctorId: string;
  lockedBy: string;
  expiresAt: string;
};

// Admin API responses
export type AdminStats = {
  totalUsers: number;
  totalAppointments: number;
  totalDoctors: number;
};

export type AdminPage<T> = ApiResponse<T[]> & {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type AdminPatient = Pick<User, 'id' | 'name' | 'email' | 'phone' | 'createdAt'>;
export type AdminPatientProfile = Pick<User, 'name' | 'email'>;

export type AdminTodayAppointment = Pick<
  Appointment,
  'id' | 'status' | 'contactEmail' | 'patientName' | 'patientPhone'
> & {
  doctor: Pick<AppointmentDoctor, 'name'>;
  timeSlot: Pick<AppointmentTimeSlot, 'startTime'> | null;
};

export type AdminPatientAppointment = Pick<Appointment, 'id' | 'status'> & {
  doctor: Pick<AppointmentDoctor, 'name'>;
  timeSlot: Pick<AppointmentTimeSlot, 'date' | 'startTime'> | null;
};

export type AdminDoctorUpcomingAppointment = Pick<
  Appointment,
  'id' | 'patientName' | 'contactEmail' | 'patientPhone'
> & {
  timeSlot: Pick<AppointmentTimeSlot, 'date' | 'startTime' | 'endTime'>;
};

export type AdminDoctorUpcomingAppointments = {
  doctor: Pick<Doctor, 'id' | 'name' | 'specialization'>;
  appointments: AdminDoctorUpcomingAppointment[];
};

export type AdminSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  doctor: Pick<Doctor, 'name' | 'specialization' | 'clinicName' | 'city'>;
};

// Generic API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  status?: number;
  message?: string;
  code?: string;
}
