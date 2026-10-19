import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { appointmentApi, bookingDraftApi } from "@/lib/api";
import { ApiResponse, AppointmentDetails, AppointmentListItem, AppointmentMutationResult, BookingConfirmationSummary, BookingDraft, BookingDraftOtpSendResult, BookingDraftOtpVerificationResult, CreateBookingDraftInput, RescheduleLockResponse } from "@/types";
import { useAuthStore } from "@/stores/authStore";

// --------------------- React Query Keys ---------------------
export const appointmentKeys = {
  all: ["appointments"] as const,
  user: (userId?: string | null) => [...appointmentKeys.all, userId ?? "anonymous"] as const,
  lists: (userId: string | null | undefined, status?: string, type?: string) =>
    [...appointmentKeys.user(userId), "list", status, type] as const,
  detail: (userId: string | null | undefined, id: string) =>
    [...appointmentKeys.user(userId), "detail", id] as const,
};

// --------------------- Hooks ---------------------

// List user's appointments with optional filters
export function useAppointments(
  status?: string,
  type?: "upcoming" | "past" | "all",
  options?: Partial<UseQueryOptions<ApiResponse<AppointmentListItem[]>>>
) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery<ApiResponse<AppointmentListItem[]>>({
    queryKey: appointmentKeys.lists(userId, status, type),
    queryFn: () => appointmentApi.list(status, type),
    enabled: Boolean(userId),
    staleTime: 30_000,
    retry: 2,
    ...options,
  });
}

// Get single appointment by ID
export function useAppointment(
  id?: string,
  options?: Partial<UseQueryOptions<ApiResponse<AppointmentDetails>>>
) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery<ApiResponse<AppointmentDetails>>({
    queryKey: appointmentKeys.detail(userId, id || ""),
    queryFn: () => {
      if (!id) throw new Error("Appointment ID is required");
      return appointmentApi.getById(id);
    },
    enabled: Boolean(userId && id),
    staleTime: 60_000,
    ...options,
  });
}

// Update appointment status (BOOKED -> CANCELLED/COMPLETED)
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation<
    ApiResponse<{ id: string; status: string }>,
    Error,
    { id: string; status: "BOOKED" | "CANCELLED" | "COMPLETED" }
  >({
    mutationFn: ({ id, status }) => appointmentApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(userId, variables.id) });
    },
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation<
    ApiResponse<{ appointment: AppointmentMutationResult; slotReleased: boolean }>,
    Error,
    { id: string }
  >({
    mutationFn: ({ id }) => appointmentApi.cancel(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(userId, variables.id) });
    },
  });
}

// Reschedule appointment (lock new slot)
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation<
    ApiResponse<RescheduleLockResponse>,
    Error,
    { id: string; newTimeSlotId: string }
  >({
    mutationFn: ({ id, newTimeSlotId }) => appointmentApi.reschedule(id, newTimeSlotId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.user(userId) });
      const doctorId = response.data?.lock.doctorId;
      if (doctorId) {
        queryClient.invalidateQueries({ queryKey: ["availableSlots", doctorId] });
        queryClient.invalidateQueries({ queryKey: ["availableDates", doctorId] });
      }
    },
  });
}

// Confirm reschedule
export function useConfirmReschedule() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation<
    ApiResponse<AppointmentMutationResult>,
    Error,
    { appointmentId: string; newSlotId: string; oldSlotId: string; doctorId: string }
  >({
    mutationFn: (data) => appointmentApi.confirmReschedule(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.user(userId) });
      queryClient.removeQueries({ queryKey: appointmentKeys.detail(userId, variables.appointmentId) });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
    },
  });
}

export function useBookingDraft() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery<ApiResponse<BookingDraft>, Error>({
    queryKey: ["bookingDraft", userId],
    queryFn: () => bookingDraftApi.get(),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useBookingConfirmation() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery<ApiResponse<BookingConfirmationSummary>, Error>({
    queryKey: ["bookingConfirmation", userId],
    queryFn: () => bookingDraftApi.getConfirmation(),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useCreateBookingDraft() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation<ApiResponse<BookingDraft>, Error, CreateBookingDraftInput>({
    mutationFn: (input) => bookingDraftApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookingDraft", userId] }),
  });
}

export function useRequestBookingDraftOtp() {
  return useMutation<ApiResponse<BookingDraftOtpSendResult>, Error>({
    mutationFn: () => bookingDraftApi.requestOtp(),
  });
}

export function useVerifyBookingDraftOtp() {
  return useMutation<ApiResponse<BookingDraftOtpVerificationResult>, Error, string>({
    mutationFn: (otp) => bookingDraftApi.verifyOtp(otp),
  });
}

export function useConfirmBookingDraft() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Pick<AppointmentMutationResult, "id">>, Error>({
    mutationFn: () => bookingDraftApi.confirm(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
      queryClient.removeQueries({ queryKey: ["bookingDraft"] });
    },
  });
}
