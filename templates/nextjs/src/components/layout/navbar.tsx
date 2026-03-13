'use client';

import { Button } from '@/components/ui/button';
import { LinkList, type LinkItem } from '@/components/widgets/link-list';
import { cn } from '@/lib/utils';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const defaultNavLinks: LinkItem[] = [
  { label: 'Features', href: PAGE_ROUTES.FEATURES },
  { label: 'FAQs', href: PAGE_ROUTES.FAQ_SECTION },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const rootPath = `/${pathname.split('/')[1]}`;
  const isDashboard = rootPath === PAGE_ROUTES.DASHBOARD;

  return (
    <nav
      className={cn(
        isDashboard
          ? 'sticky top-0 z-50 w-full'
          : 'max-w-site fixed inset-x-0 top-0 z-50 mx-auto pt-10'
      )}
    >
      <div
        className={cn(
          'flex-between min-h-20 bg-white px-6 py-3 shadow-lg',
          isDashboard ? 'border-b' : 'rounded-2xl border'
        )}
      >
        <Link
          href={PAGE_ROUTES.HOME}
          className="text-xl font-bold tracking-tight"
        >
          <span className="text-brand-gradient">template</span>
          <span>Central</span>
        </Link>

        <div className="flex gap-4">
          <LinkList
            links={defaultNavLinks}
            className="hover:text-primary transition-colors"
          />
          <Button
            onClick={() => router.push(PAGE_ROUTES.DASHBOARD)}
            className="bg-primary hover:bg-primary-hover h-12 rounded-lg px-6 py-3 font-bold text-white"
          >
            Dashboard
          </Button>
        </div>
      </div>
    </nav>
  );
}
