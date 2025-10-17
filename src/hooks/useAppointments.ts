import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { appointmentApi } from "@/lib/api";
import { ApiResponse, Appointment, LockApiResponse } from "@/types";

// --------------------- React Query Keys ---------------------
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: (status?: string, type?: string) => [...appointmentKeys.all, "list", status, type] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
};

// --------------------- Hooks ---------------------

// List user's appointments with optional filters
export function useAppointments(
  status?: string,
  type?: "upcoming" | "past" | "all",
  options?: Partial<UseQueryOptions<ApiResponse<Appointment[]>>>
) {
  return useQuery<ApiResponse<Appointment[]>>({
    queryKey: appointmentKeys.lists(status, type),
    queryFn: () => appointmentApi.list(status, type),
    staleTime: 30_000,
    retry: 2,
    ...options,
  });
}

// Get single appointment by ID
export function useAppointment(
  id?: string,
  options?: Partial<UseQueryOptions<ApiResponse<Appointment>>>
) {
  return useQuery<ApiResponse<Appointment>>({
    queryKey: appointmentKeys.detail(id || ""),
    queryFn: () => {
      if (!id) throw new Error("Appointment ID is required");
      return appointmentApi.getById(id);
    },
    enabled: Boolean(id),
    staleTime: 60_000,
    ...options,
  });
}

// Update appointment status (BOOKED -> CANCELLED/COMPLETED)
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<{ id: string; status: string }>,
    Error,
    { id: string; status: "BOOKED" | "CANCELLED" | "COMPLETED" }
  >({
    mutationFn: ({ id, status }) => appointmentApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
    },
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<{ appointment: Appointment; slotReleased: boolean }>,
    Error,
    { id: string }
  >({
    mutationFn: ({ id }) => appointmentApi.cancel(id),
    onSuccess: (_, variables) => {
queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
    },
  });
}

// Reschedule appointment (lock new slot)
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<{ oldSlotId: string; lock: LockApiResponse }>,
    Error,
    { id: string; newTimeSlotId: string }
  >({
    mutationFn: ({ id, newTimeSlotId }) => appointmentApi.reschedule(id, newTimeSlotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

// Confirm reschedule
export function useConfirmReschedule() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<Appointment>,
    Error,
    { appointmentId: string; newSlotId: string; oldSlotId: string; doctorId: string }
  >({
    mutationFn: (data) => appointmentApi.confirmReschedule(data),
    onSuccess: (_, variables) => {
queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.appointmentId) });
    },
  });
}
