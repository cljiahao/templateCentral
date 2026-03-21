'use client';

import { Button } from '@/components/ui/button';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <form action={() => signOut({ redirectTo: PAGE_ROUTES.HOME })}>
      <Button
        type="submit"
        className="bg-primary hover:bg-primary-hover h-12 w-full rounded-md font-bold text-white"
      >
        Log out
      </Button>
    </form>
  );
}
