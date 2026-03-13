import { PAGE_ROUTES } from '@/lib/constants/routes';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set<string>([PAGE_ROUTES.HOME]);

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth');
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // TODO: Replace with real auth check (e.g., NextAuth `auth()`, JWT validation)
  // import { auth } from '@/auth';
  // export default auth((req) => { ... });
  const isAuthenticated = true;

  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL(PAGE_ROUTES.HOME, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp)$).*)',
  ],
};
