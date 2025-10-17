import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { ApiResponse, Appointment, AvailableSlot, Doctor, DoctorQuery, LockApiResponse, LockSlotData, LockSlotInput, SlotFilter, Token, User } from "@/types";
import { UserLoginInput, UserRegistrationInput } from "./validations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ------------------ Axios instance ------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }, 
});

// ------------------ Auth Header Helper ------------------
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ------------------ Token Refresh ------------------
export async function refreshToken(): Promise<void> {

  const response = await api.post<ApiResponse<Token>>("/auth/refresh", {}, { withCredentials: true } );
  const tokens = response.data.data;
  if (tokens?.accessToken) setAuthTokens(tokens.accessToken);
}

// ------------------ Generic Axios Request ------------------
const makeRequest = async <T>(endpoint: string, options: AxiosRequestConfig = {}) => {
  return api.request<T>({
    url: endpoint,
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
};

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
        if (typeof window !== "undefined") window.location.href = "/auth";
        throw new Error("Authentication failed");
      }
    }
 
    throw new Error(
  (error.response?.data as { error?: string })?.error ??
  error.message ??
  `Request failed: ${error.response?.status}`
);
  }
} 

// ------------------ Auth API ------------------
export const authApi = {
  register(data: UserRegistrationInput) {
    return apiRequest<ApiResponse<{ user: User; accessToken: string }>>("/auth/register", {
      method: "POST",
      data,
      withCredentials: true,
    }, false);
  },
  login(data: UserLoginInput) {
    return apiRequest<ApiResponse<{ user: User; accessToken: string }>>("/auth/login", {
      method: "POST",
      data,
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
    return apiRequest<ApiResponse<{ email: string; otp: string }>>(
      "/auth/generate-otp",
      { method: "POST", data: { email } }
    );
  },

  verifyOtp(email: string, otp: string) {
    return apiRequest<ApiResponse<{ otpVerifiedUntil: string }>>(
      "/auth/verify-otp",
      { method: "POST", data: { email, otp } }
    );
  },
  getMe() {
    return apiRequest<ApiResponse<User>>("/auth/me");
  },
};

// ------------------ Auth Token Helpers ------------------
export const setAuthTokens = (accessToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", accessToken);
  }
};

export const clearAllAuthData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("auth-storage");
  }
};


export const removeAuthTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

export const removeAuthToken = () => {
  removeAuthTokens();
};

export const getAuthToken = (): string | null => {
  return getAccessToken();
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

  async getAllDoctors(filter?: DoctorQuery): Promise<ApiResponse<Doctor[]>> {
    const queryString = filter
        ? buildQueryString({
            specialization: filter.specialization,
            consultation_mode: filter.consultationMode,
            available: filter.earliestAvailable,
            q: filter.q,
            limit: filter.limit
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

  async getAvailableSlots(
   filter: SlotFilter
  ): Promise<ApiResponse<{ slots: AvailableSlot[] }>> {
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

  async confirmAppointment(
  doctorId: string,
  slotId: string,
  notes?: string
): Promise<ApiResponse<Appointment>> {
  return apiRequest(
    `/appointments/confirm`,
    {
      method: "POST",
      data: { doctorId, timeSlotId: slotId, notes },
    },
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


// ------------------ Appointment API ------------------
export const appointmentApi = {
  // List user's appointments with optional filters
  list(status?: string, type?: "upcoming" | "past" | "all") {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    return apiRequest<ApiResponse<Appointment[]>>(
      `/appointments?${params.toString()}`
    );
  },

  // Get single appointment by ID
  getById(id: string) {
    if (!id) throw new Error("Appointment ID is required");
    return apiRequest<ApiResponse<Appointment>>(`/appointments/${id}`);
  },

  // Update appointment status (BOOKED -> CANCELLED/COMPLETED)
  updateStatus(id: string, status: "BOOKED" | "CANCELLED" | "COMPLETED") {
    if (!id) throw new Error("Appointment ID is required");
    return apiRequest<ApiResponse<{ id: string; status: string }>>(
      `/appointments/${id}/status`,
      { method: "PATCH", data: { status } }
    );
  },

  // Cancel appointment
  cancel(id: string) {
    if (!id) throw new Error("Appointment ID is required");
    return apiRequest<ApiResponse<{ appointment: Appointment; slotReleased: boolean }>>(
      `/appointments/${id}/cancel`,
      { method: "PUT" }
    );
  },

  // Reschedule appointment (lock new slot)
  reschedule(id: string, newTimeSlotId: string) {
    if (!id || !newTimeSlotId) throw new Error("Appointment ID and newTimeSlotId are required");
    return apiRequest<ApiResponse<{ oldSlotId: string; lock: LockApiResponse }>>(
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
    return apiRequest<ApiResponse<Appointment>>(
      `/appointments/reschedule/confirm`,
      { method: "POST", data }
    );
  },
};
