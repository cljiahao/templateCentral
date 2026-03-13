import { Button } from '@/components/ui/button';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';

export default function ItemNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Item not found</h2>
      <p className="text-muted-foreground">
        The item you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href={PAGE_ROUTES.DASHBOARD}>Back to Dashboard</Link>
      </Button>
    </div>
  );
}
