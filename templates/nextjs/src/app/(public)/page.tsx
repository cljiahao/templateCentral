export default function Home() {
  return (
    <div className="flex-center min-h-screen flex-col gap-6">
      <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
        <span className="text-brand-gradient">template</span>
        <span>Central</span>
      </h1>
      <p className="text-muted-foreground max-w-md text-center text-lg">
        A production-ready Next.js template with shadcn/ui, Tailwind CSS, and
        everything you need to build modern web applications.
      </p>
    </div>
  );
}
