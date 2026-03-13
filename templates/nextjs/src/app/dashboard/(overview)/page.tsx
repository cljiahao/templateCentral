import { ExampleCard, EXAMPLE_ITEMS } from '@/features/example';

export default function DashboardOverviewPage() {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        This is a placeholder dashboard page. Replace with your content.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {EXAMPLE_ITEMS.map((item) => (
          <ExampleCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
