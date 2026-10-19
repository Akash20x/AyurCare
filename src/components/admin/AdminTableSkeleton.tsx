import { Skeleton } from "@/components/ui/skeleton";

type AdminTableSkeletonProps = {
  columns?: number;
  rows?: number;
  label?: string;
};

export function AdminTableSkeleton({ columns = 5, rows = 6, label = "Loading table data" }: AdminTableSkeletonProps) {
  return (
    <div role="status" aria-label={label} className="overflow-hidden rounded-2xl border border-green-100 dark:border-green-900/40">
      <span className="sr-only">{label}</span>
      <div className="overflow-x-auto" aria-hidden="true">
        <table className="w-full min-w-180">
          <thead className="bg-green-50 dark:bg-green-950/30">
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-5 py-3"><Skeleton className="h-3 w-20 bg-green-100 dark:bg-green-900/60" /></th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-green-50 dark:divide-green-900/40">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} className="h-12">
                {Array.from({ length: columns }, (_, columnIndex) => (
                  <td key={columnIndex} className="px-5 py-1"><Skeleton className={columnIndex === 0 ? "h-3 w-28" : "h-3 w-20"} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
