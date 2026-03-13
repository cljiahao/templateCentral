import { Link } from 'react-router';
import { PAGE_ROUTES } from '@/lib/constants/routes';

export function NotFoundPage() {
  return (
    <div className="flex-center min-h-[60vh] flex-col gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">Page not found</p>
      <Link
        to={PAGE_ROUTES.HOME}
        className="mt-2 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
      >
        Go back home
      </Link>
    </div>
  );
}
