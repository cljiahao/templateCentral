import { ExampleList } from '@/features/example';

export default function DashboardOverviewPage() {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        This is a placeholder dashboard page. Replace with your content.
      </p>

      <div className="mt-8">
        <ExampleList />
      </div>
    </div>
  );
}
