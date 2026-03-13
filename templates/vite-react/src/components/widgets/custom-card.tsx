import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CustomCardProps {
  header: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function CustomCard({ header, description, children, className }: CustomCardProps) {
  return (
    <div className={cn('rounded-lg border bg-white p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold">{header}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
