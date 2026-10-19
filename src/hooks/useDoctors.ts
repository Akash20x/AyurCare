import {
  useMutation,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { doctorApi } from "@/lib/api";
import { formatDateKey } from "@/lib/helpers";
import {
  ApiResponse,
  AvailableSlot,
  CreateBatchTimeSlotsInput,
  CreateTimeSlotsInput,
  Doctor,
  DoctorFilter,
  DoctorInput,
  DoctorQuery,
  PaginatedDoctorResponse,
  LockSlotData,
  LockSlotInput,
  SlotFilter,
} from "@/types";

// --------------------- React Query Keys ---------------------
export const doctorKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorKeys.all, "list"] as const,
  list: (filter?: DoctorFilter) => [...doctorKeys.lists(), filter] as const,
  infiniteList: (filter?: DoctorQuery) => [...doctorKeys.lists(), "infinite", filter] as const,
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
  const isToday = date === formatDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => {
    const [h, m] = slot.startTime.split(":").map(Number);
    const slotMinutes = h * 60 + m;
    return slot.status === "AVAILABLE" && (!isToday || slotMinutes > currentMinutes);
  });
}

export type DoctorAvailability = {
  dates: string[];
  slots: AvailableSlot[];
};

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

export function useInfiniteDoctors(filter: DoctorQuery, initialPage?: PaginatedDoctorResponse) {
  return useInfiniteQuery({
    queryKey: doctorKeys.infiniteList(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => doctorApi.getAllDoctors({
      ...filter,
      ...(pageParam > 1 ? { page: pageParam } : {}),
    }),
    getNextPageParam: (lastPage) => (
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined
    ),
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [1] }
      : undefined,
    staleTime: 30_000,
    retry: 2,
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
  return useQuery<DoctorAvailability, Error>({
    queryKey: doctorKeys.availableDates(doctorId),
    queryFn: async () => {
      if (!doctorId) return { dates: [], slots: [] };

      const today = new Date();
      const start = formatDateKey(today);

      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 27);      // next 28 days
      const end = formatDateKey(endDate);

      // ✅ Single API call with start & end
      const res = await doctorApi.getAvailableSlots({ doctorId, start, end });

      const allSlots: AvailableSlot[] = Array.isArray(res?.data)
        ? (res.data as AvailableSlot[])
        : [];

      // ✅ Group slots by date & filter
      const dateSet = new Set<string>();
      allSlots.forEach((slot) => {
        const dateKey = slot.date.slice(0, 10);
        if (filterSlots([slot], dateKey).length > 0) {
          dateSet.add(dateKey);
        }
      });

      return {
        dates: [...dateSet].sort(),
        slots: allSlots,
      };
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

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{ doctor: Doctor }>, Error, DoctorInput>({
    mutationFn: doctorApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: doctorKeys.lists() }),
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{ doctor: Doctor }>, Error, { doctorId: string; data: Partial<DoctorInput> }>({
    mutationFn: ({ doctorId, data }) => doctorApi.update(doctorId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: doctorKeys.byId(variables.doctorId) });
    },
  });
}

export function useCreateTimeSlots() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<AvailableSlot[]>, Error, CreateTimeSlotsInput>({
    mutationFn: doctorApi.createSlots,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["availableSlots", variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: doctorKeys.availableDates(variables.doctorId) });
    },
  });
}

export function useCreateBatchTimeSlots() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{ slotsCreated: number }>, Error, CreateBatchTimeSlotsInput>({
    mutationFn: doctorApi.createBatchSlots,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["availableSlots", variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: doctorKeys.availableDates(variables.doctorId) });
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
