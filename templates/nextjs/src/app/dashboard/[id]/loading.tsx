import { Skeleton } from '@/components/ui/skeleton';

export default function DetailLoading() {
  return (
    <div className="max-w-site mx-auto flex w-full flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
