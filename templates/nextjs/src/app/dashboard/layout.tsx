import { Navbar, SiteFooter } from '@/components/layout';
import { Providers } from '@/components/layout/providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </Providers>
  );
}
