import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-12">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-5 w-96" />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
