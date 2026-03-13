import { PAGE_ROUTES } from '@/lib/constants/routes';
import { Link, useLocation } from 'react-router';

const NAV_LINKS = [
  { label: 'Home', href: PAGE_ROUTES.HOME },
  { label: 'Dashboard', href: PAGE_ROUTES.DASHBOARD },
] as const;

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="max-w-site flex-between mx-auto px-6 py-4">
        <Link to={PAGE_ROUTES.HOME} className="text-xl font-bold tracking-tight">
          templateCentral
        </Link>

        <div className="flex gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
