import { useExampleItems } from '../hooks';
import { ExampleCard } from './example-card';

export function ExampleList() {
  const { data: items, isLoading, error } = useExampleItems();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="text-destructive">Failed to load items.</p>;
  }

  if (!items?.length) {
    return <p className="text-muted-foreground">No items found.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ExampleCard key={item.id} item={item} />
      ))}
    </div>
  );
}
