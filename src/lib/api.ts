import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { AdminDoctorUpcomingAppointments, AdminPage, AdminPatient, AdminPatientAppointment, AdminPatientProfile, AdminSlot, AdminStats, AdminTodayAppointment, ApiResponse, AppointmentDetails, AppointmentListItem, AppointmentMutationResult, AvailableSlot, BookingConfirmationSummary, BookingDraft, BookingDraftOtpSendResult, BookingDraftOtpVerificationResult, CreateBatchTimeSlotsInput, CreateBookingDraftInput, CreateTimeSlotsInput, Doctor, DoctorInput, DoctorQuery, LockSlotData, LockSlotInput, OtpSendResult, OtpVerificationResult, PaginatedDoctorResponse, RescheduleLockResponse, SlotFilter, User } from "@/types";
import { UserLoginInput, UserRegistrationInput } from "./validations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type SessionUser = Pick<User, "id" | "name" | "email" | "role">;

export type SessionResponse =
  | { success: true; user: SessionUser | Record<string, never> }
  | { success: false; user: Record<string, never> };

export const hasAuthenticatedSession = (
  session: SessionResponse
): session is { success: true; user: SessionUser } => (
  session.success && "id" in session.user
);

export type SessionCheckResult = {
  session: SessionResponse;
  shouldRefresh: boolean;
};

// ------------------ Axios instance ------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ------------------ Token Refresh ------------------
// The refresh endpoint rotates the refresh-token cookie.  During app startup
// several protected requests can receive a 401 at the same time; they must all
// await the same refresh or every request after the first will use the now
// invalidated cookie.
let refreshInFlight: Promise<void> | null = null;

export async function refreshToken(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = api
      .post("/auth/refresh", {}, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

// ------------------ Generic Axios Request ------------------
const makeRequest = async <T>(endpoint: string, options: AxiosRequestConfig = {}) => {
  return api.request<T>({
    url: endpoint,
    ...options,
  });
};

type ApiRequestError = Error & {
  status?: number;
  code?: string;
};

const createApiRequestError = (
  message: string,
  status?: number,
  code?: string
): ApiRequestError => Object.assign(new Error(message), { status, code });

async function apiRequest<T>(
  endpoint: string,
  options: AxiosRequestConfig = {},
  requireAuth = true
): Promise<T> {
  try {
    const response = await makeRequest<T>(endpoint, options);
    return response.data;
  } catch (err) {
    const error = err as AxiosError;

    // Handle 401 by trying token refresh
    if (error.response?.status === 401 && requireAuth) {
      try {
        await refreshToken();
        const retryResponse = await makeRequest<T>(endpoint, options);
        return retryResponse.data;
      } catch {
        clearAllAuthData();
        throw createApiRequestError("Authentication failed", 401);
      }
    }
 
    const errorBody = error.response?.data as { error?: string; code?: string } | undefined;
    throw createApiRequestError(
      errorBody?.error ?? error.message ?? `Request failed: ${error.response?.status}`,
      error.response?.status,
      errorBody?.code
    );
  }
} 

// ------------------ Auth API ------------------
export const authApi = {
  register(data: UserRegistrationInput) {
    return apiRequest<ApiResponse<{ user: User }>>("/auth/register", {
      method: "POST",
      data,
      withCredentials: true,
    }, false);
  },
  login(data: UserLoginInput) {
    return apiRequest<ApiResponse<{ user: User }>>("/auth/login", {
      method: "POST",
      data,
      withCredentials: true,
    }, false);
  },
  loginWithGoogle(credential: string) {
    return apiRequest<ApiResponse<{ user: User }>>("/auth/google", {
      method: "POST",
      data: { credential },
      withCredentials: true,
    }, false);
  },

  logout() {
    return apiRequest<ApiResponse<void>>(
      "/auth/logout",
      { method: "POST", withCredentials: true },
      false
    );
  },
  generateOtp(email: string) {
    return apiRequest<ApiResponse<OtpSendResult>>(
      "/auth/generate-otp",
      { method: "POST", data: { email } }
    );
  },

  verifyOtp(email: string, otp: string) {
    return apiRequest<ApiResponse<OtpVerificationResult>>(
      "/auth/verify-otp",
      { method: "POST", data: { email, otp } }
    );
  },
  async getSession(): Promise<SessionCheckResult> {
    const response = await api.get<SessionResponse>("/auth/session", {
      withCredentials: true,
      validateStatus: (status) => status === 200 || status === 401,
    });
    return {
      session: response.data,
      shouldRefresh: response.status === 401,
    };
  },
};

export const clearAllAuthData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-storage");
  }
};

export const adminApi = {
  stats: () => apiRequest<ApiResponse<AdminStats>>("/admin/stats"),
  todayAppointments: (status = "BOOKED", page = 1) => apiRequest<AdminPage<AdminTodayAppointment>>(`/admin/appointments/today?${buildQueryString({ status, page, limit: 10 })}`),
  patients: (page = 1) => apiRequest<AdminPage<AdminPatient>>(`/admin/patients?${buildQueryString({ page, limit: 10 })}`),
  patientAppointments: (id: string) => apiRequest<ApiResponse<{ patient: AdminPatientProfile; appointments: AdminPatientAppointment[] }>>(`/admin/patients/${id}/appointments`),
  doctorUpcomingAppointments: (id: string) => apiRequest<ApiResponse<AdminDoctorUpcomingAppointments>>(`/admin/doctors/${id}/appointments/upcoming`),
  upcomingSlots: (page = 1, doctorId?: string) => apiRequest<AdminPage<AdminSlot>>(`/admin/slots/upcoming?${buildQueryString({ page, limit: 10, doctorId })}`),
};

function buildQueryString(
  params: Record<string, string | number | boolean | (string | number | boolean)[] | null | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams.toString();
}

// ------------------ Doctor API ------------------
export const doctorApi = {

  async getAllDoctors(filter?: DoctorQuery): Promise<PaginatedDoctorResponse> {
    const queryString = filter
        ? buildQueryString({
            specialization: filter.specialization,
            consultation_mode: filter.consultationMode,
            available: filter.earliestAvailable,
            q: filter.q,
            limit: filter.limit,
            page: filter.page,
          })
        : "";

    return apiRequest(
      `/doctors${queryString ? `?${queryString}` : ""}`,
      {},
      false
    );
  },

  async getDoctorById(doctorId: string): Promise<ApiResponse<Doctor>> {
    if (!doctorId) throw new Error("Doctor ID is required");
    return apiRequest<ApiResponse<Doctor>>(`/doctors/${doctorId}`, {}, false);
  },

  create(data: DoctorInput) {
    return apiRequest<ApiResponse<{ doctor: Doctor }>>(
      "/doctors",
      { method: "POST", data }
    );
  },

  update(doctorId: string, data: Partial<DoctorInput>) {
    if (!doctorId) throw new Error("Doctor ID is required");
    return apiRequest<ApiResponse<{ doctor: Doctor }>>(
      `/doctors/${doctorId}`,
      { method: "PUT", data }
    );
  },

  createSlots({ doctorId, ...data }: CreateTimeSlotsInput) {
    if (!doctorId) throw new Error("Doctor ID is required");
    return apiRequest<ApiResponse<AvailableSlot[]>>(
      `/doctors/${doctorId}/slots`,
      { method: "POST", data }
    );
  },

  createBatchSlots({ doctorId, ...data }: CreateBatchTimeSlotsInput) {
    if (!doctorId) throw new Error("Doctor ID is required");
    return apiRequest<ApiResponse<{ slotsCreated: number }>>(
      `/doctors/${doctorId}/slots/batch`,
      { method: "POST", data }
    );
  },

  async getAvailableSlots(
   filter: SlotFilter
  ): Promise<ApiResponse<AvailableSlot[]>> {
    if (!filter.doctorId) throw new Error("Doctor ID is required");

      const { doctorId, date, start, end } = filter;

      const queryString = buildQueryString(
          date ? { date } : { start, end }   // ✅ handle date OR range
        );

    return apiRequest(
      `/doctors/${doctorId}/slots${queryString ? `?${queryString}` : ""}`,
      {},
      false // assuming slots are public too; set to true if auth is required
    );
  },

  async lockSlot({ doctorId, slotId }: LockSlotInput): Promise<ApiResponse<LockSlotData>> {
    return apiRequest<ApiResponse<LockSlotData>>(
      `/doctors/${doctorId}/slots/${slotId}/lock`,
      { method: "POST" },
      true
    );
  },

  async getSlotById(
    doctorId: string,
    slotId: string
  ): Promise<
    ApiResponse<{
      slotId: string;
      doctorId: string;
      date: string;
      startTime: string;
      endTime: string;
      status: string;
      lockExpires: string | null;
      lockedBy: string | null;
      doctor: {
        name: string;
        specialization: string;
        consultationMode: string;
        experience: number;
      };
    }>
  > {
    if (!doctorId || !slotId) throw new Error("doctorId and slotId are required");

    return apiRequest(
      `/doctors/${doctorId}/slots/${slotId}`,
      {},
      true 
    );
  },
};

// ------------------ Booking Draft API ------------------
export const bookingDraftApi = {
  create(data: CreateBookingDraftInput) {
    return apiRequest<ApiResponse<BookingDraft>>(
      "/booking-drafts",
      { method: "POST", data }
    );
  },

  get() {
    return apiRequest<ApiResponse<BookingDraft>>("/booking-drafts/current");
  },

  getConfirmation() {
    return apiRequest<ApiResponse<BookingConfirmationSummary>>("/booking-drafts/current/confirmation");
  },

  requestOtp() {
    return apiRequest<ApiResponse<BookingDraftOtpSendResult>>(
      "/booking-drafts/current/otp",
      { method: "POST" }
    );
  },

  verifyOtp(otp: string) {
    return apiRequest<ApiResponse<BookingDraftOtpVerificationResult>>(
      "/booking-drafts/current/verify-otp",
      { method: "POST", data: { otp } }
    );
  },

  confirm() {
    return apiRequest<ApiResponse<Pick<AppointmentMutationResult, "id">>>(
      "/booking-drafts/current/confirm",
      { method: "POST" }
    );
  },
};


// ------------------ Appointment API ------------------
export const appointmentApi = {
  // List user's appointments with optional filters
  list(status?: string, type?: "upcoming" | "past" | "all") {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    return apiRequest<ApiResponse<AppointmentListItem[]>>(
      `/appointments?${params.toString()}`
    );
  },

  // Get single appointment by ID
  getById(id: string) {
    if (!id) throw new Error("Appointment ID is required");
    return apiRequest<ApiResponse<AppointmentDetails>>(`/appointments/${id}`);
  },

  // Update appointment status (BOOKED -> CANCELLED/COMPLETED)
  updateStatus(id: string, status: "BOOKED" | "CANCELLED" | "COMPLETED") {
    if (!id) throw new Error("Appointment ID is required");
    return apiRequest<ApiResponse<{ id: string; status: string }>>(
      `/appointments/${id}/status`,
      { method: "PUT", data: { status } }
    );
  },

  // Cancel appointment
  cancel(id: string) {
    if (!id) throw new Error("Appointment ID is required");
    return apiRequest<ApiResponse<{ appointment: AppointmentMutationResult; slotReleased: boolean }>>(
      `/appointments/${id}/cancel`,
      { method: "PUT" }
    );
  },

  // Reschedule appointment (lock new slot)
  reschedule(id: string, newTimeSlotId: string) {
    if (!id || !newTimeSlotId) throw new Error("Appointment ID and newTimeSlotId are required");
    return apiRequest<ApiResponse<RescheduleLockResponse>>(
      `/appointments/${id}/reschedule`,
      { method: "PUT", data: { newTimeSlotId } }
    );
  },

  // Confirm reschedule
  confirmReschedule(data: {
    appointmentId: string;
    newSlotId: string;
    oldSlotId: string;
    doctorId: string;
  }) {
    return apiRequest<ApiResponse<AppointmentMutationResult>>(
      `/appointments/reschedule/confirm`,
      { method: "POST", data }
    );
  },
};
