import { Skeleton } from "@/components/ui/skeleton";

export function DoctorGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading doctors"
    >
      <span className="sr-only">Loading doctors</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[22rem] w-full max-w-[26rem] justify-self-center flex-col gap-6 rounded-xl border border-gray-200 bg-white py-6 shadow-sm"
          aria-hidden="true"
        >
          <div className="flex items-start gap-3 px-6">
            <Skeleton className="size-12 shrink-0 rounded-full bg-emerald-100" />
            <div className="flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-3/5 bg-slate-200" />
              <Skeleton className="h-3.5 w-2/5 bg-slate-200" />
              <Skeleton className="h-3 w-1/3 bg-slate-100" />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 px-6">
            <div className="space-y-2 rounded-lg bg-emerald-50 p-3">
              <Skeleton className="h-3 w-full bg-emerald-100" />
              <Skeleton className="h-3 w-5/6 bg-emerald-100" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24 bg-slate-200" />
              <Skeleton className="h-8 w-32 bg-slate-200" />
            </div>
            <Skeleton className="h-3.5 w-1/2 bg-slate-200" />
            <Skeleton className="h-3.5 w-2/3 bg-slate-200" />
            <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
              <Skeleton className="h-9 w-full bg-slate-200" />
              <Skeleton className="h-9 w-full bg-emerald-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
