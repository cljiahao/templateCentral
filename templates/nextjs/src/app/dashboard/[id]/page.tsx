import { Button } from '@/components/ui/button';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { logError } from '@/lib/errors/error-log-handler';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: Replace with your own data fetching logic
  let item;
  try {
    item = { id, title: `Item ${id}`, description: 'Replace with real data.' };
  } catch (error) {
    logError(`Item not found: ${id}`, error);
    notFound();
  }

  return (
    <div className="max-w-site mx-auto flex w-full flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{item.title}</h1>
        <Button asChild variant="outline">
          <Link href={PAGE_ROUTES.DASHBOARD}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">{item.description}</p>
      </div>
    </div>
  );
}
