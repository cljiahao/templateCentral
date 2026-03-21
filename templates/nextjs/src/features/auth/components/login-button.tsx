'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signIn } from 'next-auth/react';

interface LoginButtonProps {
  className?: string;
  label?: string;
  provider: string;
  redirectTo: string;
}

export function LoginButton({
  className = '',
  label = 'Log in',
  provider,
  redirectTo,
}: LoginButtonProps) {
  return (
    <form action={() => signIn(provider, { redirectTo })}>
      <Button
        type="submit"
        className={cn(
          'bg-primary hover:bg-primary-hover w-full rounded-md font-bold',
          className
        )}
      >
        {label}
      </Button>
    </form>
  );
}
