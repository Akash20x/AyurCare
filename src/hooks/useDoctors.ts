import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { doctorApi } from "@/lib/api";
import {
  ApiResponse,
  Appointment,
  AvailableSlot,
  Doctor,
  DoctorFilter,
  DoctorQuery,
  LockSlotData,
  LockSlotInput,
  SlotFilter,
} from "@/types";

// --------------------- React Query Keys ---------------------
export const doctorKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorKeys.all, "list"] as const,
  list: (filter?: DoctorFilter) => [...doctorKeys.lists(), filter] as const,
  profile: (name: string) => [...doctorKeys.all, "profile", name] as const,
  byId: (id?: string) => ["doctorById", id] as const,
  availableDates: (doctorId?: string) => ["availableDates", doctorId] as const,
  availableSlots: (doctorId?: string, date?: string) =>
    ["availableSlots", doctorId, date] as const,
};

// --------------------- Helper Functions ---------------------
function slugToName(slug: string) {
  if (!slug) return "";
  const withoutPrefix = slug.toLowerCase().startsWith("dr-")
    ? slug.slice(3)
    : slug;
  return withoutPrefix.replace(/-/g, " ");
}

export function filterSlots(slots: AvailableSlot[], date: string): AvailableSlot[] {
  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => {
    const [h, m] = slot.startTime.split(":").map(Number);
    const slotMinutes = h * 60 + m;
    return slot.status === "AVAILABLE" && (!isToday || slotMinutes > currentMinutes);
  });
}

// --------------------- Hooks ---------------------

// Get doctors list
export function useDoctors<T extends DoctorFilter = DoctorFilter>(
  filter?: T,
  options?: Partial<UseQueryOptions<ApiResponse<Doctor[]>>>
) {
  return useQuery<ApiResponse<Doctor[]>>({
    queryKey: doctorKeys.list(filter),
    queryFn: () => doctorApi.getAllDoctors(filter),
    staleTime: 30_000,
    retry: 2,
    ...options,
  });
}

// Get doctor profile by slug
export function useDoctorProfileByName(
  slug: string | undefined,
  options?: Partial<UseQueryOptions<Doctor>>
) {
  return useQuery<Doctor>({
    queryKey: ["doctorProfile", slug || ""],
    queryFn: async () => {
      if (!slug) throw new Error("Doctor name is required");
      const name = slugToName(slug);
      const query: DoctorQuery = { q: name };
      const res: ApiResponse<Doctor[]> = await doctorApi.getAllDoctors(query);
      if (!res.data || res.data.length === 0) throw new Error("Doctor not found");
      return res.data[0];
    },
    enabled: Boolean(slug),
    staleTime: 60_000,
    ...options,
  });
}

export function useDoctorById(
  doctorId?: string | null,
  options?: Partial<UseQueryOptions<ApiResponse<Doctor>>>
) {
  return useQuery<ApiResponse<Doctor>, Error>({
    queryKey: doctorKeys.byId(doctorId ?? undefined),
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID is required");
      return doctorApi.getDoctorById(doctorId);
    },
    enabled: Boolean(doctorId),
    staleTime: 60_000, // cache for 1 minute
    ...options,
  });
}

// Get available slots for a doctor on a specific date
export function useAvailableSlots(filter?: SlotFilter) {
  return useQuery<AvailableSlot[], Error>({
    queryKey: doctorKeys.availableSlots(filter?.doctorId, filter?.date),
    queryFn: async () => {
      if (!filter?.doctorId || !filter?.date) return [];

      const res = await doctorApi.getAvailableSlots(filter);

      const allSlots: AvailableSlot[] = Array.isArray(res?.data)
        ? res.data
        : [];

      return filterSlots(allSlots, filter.date);
    },
    enabled: Boolean(filter?.doctorId && filter?.date),
    staleTime: 60_000,
  });
}

// Get available dates (next 28 days only where slots exist)
// hooks/useAvailableDates.ts
export function useAvailableDates(doctorId?: string) {
  return useQuery<string[], Error>({
    queryKey: doctorKeys.availableDates(doctorId),
    queryFn: async () => {
      if (!doctorId) return [];

      const today = new Date();
      const start = today.toISOString().slice(0, 10);

      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 27);      // next 28 days
      const end = endDate.toISOString().slice(0, 10);

      // ✅ Single API call with start & end
      const res = await doctorApi.getAvailableSlots({ doctorId, start, end });

      const allSlots: AvailableSlot[] = Array.isArray(res?.data)
        ? (res.data as AvailableSlot[])
        : [];

      // ✅ Group slots by date & filter
      const dateSet = new Set<string>();
      allSlots.forEach((slot) => {
        const dateKey = slot.date.slice(0, 10);
       if (dateKey === new Date().toISOString().slice(0, 10) || filterSlots([slot], dateKey).length > 0) {
          dateSet.add(dateKey);
        }
      });

      return [...dateSet].sort(); 
    },
    enabled: Boolean(doctorId),
    staleTime: 60_000,
  });
}


// Lock a slot mutation
export function useLockSlot() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<LockSlotData>, Error, LockSlotInput>({
    mutationFn: (input) => doctorApi.lockSlot(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: doctorKeys.availableSlots(variables.doctorId, variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: doctorKeys.availableDates(variables.doctorId),
      });
    },
  });
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Appointment>, Error, { doctorId: string; slotId: string; notes?: string }>({
    mutationFn: ({ doctorId, slotId, notes }) =>
      doctorApi.confirmAppointment(doctorId, slotId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: doctorKeys.availableSlots(variables.doctorId, undefined),
      });
      queryClient.invalidateQueries({
        queryKey: doctorKeys.availableDates(variables.doctorId),
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments"], // if you add useAppointments hook
      });
    },
  });
}


// --------------------- Get single slot by ID ---------------------
export function useSlot(
  doctorId?: string | null | undefined,
  slotId?: string | null | undefined,
  options?: Partial<UseQueryOptions<
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
  >>
) {
  return useQuery({
    queryKey: ["slot", doctorId, slotId],
    queryFn: async () => {
      if (!doctorId || !slotId) throw new Error("doctorId and slotId are required");
      return doctorApi.getSlotById(doctorId, slotId);
    },
    enabled: Boolean(doctorId && slotId),
    staleTime: 30_000,
    retry: 1,
    ...options,
  });
}
