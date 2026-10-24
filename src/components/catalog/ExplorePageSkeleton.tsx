import { DoctorGridSkeleton } from "@/components/catalog/DoctorGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function ExplorePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold text-green-700">Explore Doctors</h1>

        <div
          className="grid grid-cols-1 items-end gap-3 md:flex md:flex-wrap md:items-end md:gap-4"
          aria-hidden="true"
        >
          <div className="min-w-[250px] flex-1 space-y-1">
            <Skeleton className="h-4 w-14 bg-slate-200" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/90 shadow-sm" />
          </div>
          <div className="min-w-[200px] space-y-1">
            <Skeleton className="h-4 w-24 bg-slate-200" />
            <Skeleton className="h-10 w-full rounded-md bg-white/90 shadow-sm" />
          </div>
          <div className="min-w-[150px] space-y-1">
            <Skeleton className="h-4 w-20 bg-slate-200" />
            <Skeleton className="h-10 w-36 rounded-md bg-white/90 shadow-sm" />
          </div>
          <div className="mt-2 flex w-full gap-2 md:mt-0">
            <Skeleton className="h-10 w-20 bg-emerald-200" />
          </div>
        </div>

        <DoctorGridSkeleton />
      </div>
    </div>
  );
}
