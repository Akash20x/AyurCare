export function DoctorGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading doctors">
      {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-52 w-full max-w-[26rem] justify-self-center rounded-xl bg-white/60 border border-gray-200 animate-pulse shadow-sm" />)}
    </div>
  );
}
