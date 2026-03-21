'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ExampleCard } from './example-card';
import { useExampleItems } from '../hooks/use-example-items.query';

export function ExampleList() {
  const { data: items, isLoading, isError, error } = useExampleItems();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        Failed to load items{error instanceof Error ? `: ${error.message}` : '.'}
      </p>
    );
  }

  if (!items?.length) {
    return <p className="text-muted-foreground text-sm">No items found.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ExampleCard key={item.id} item={item} />
      ))}
    </div>
  );
}
