import { Link } from 'react-router';
import { PAGE_ROUTES } from '@/lib/constants/routes';

export function HomePage() {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Vite + React Template</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          A production-ready starter with React Router, TanStack Query, Tailwind CSS, and a
          feature-driven folder structure.
        </p>
        <Link
          to={PAGE_ROUTES.DASHBOARD}
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
