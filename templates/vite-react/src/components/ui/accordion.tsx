import { Accordion as AccordionPrimitive } from 'radix-ui';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item> & {
  variant?: 'default' | 'gradient';
}) {
  if (variant === 'gradient') {
    return (
      <div className="bg-brand-gradient rounded-lg p-px">
        <AccordionPrimitive.Item
          data-slot="accordion-item"
          className={cn('rounded-lg bg-white', className)}
          {...props}
        />
      </div>
    );
  }

  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('rounded-lg border', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-center justify-between p-4 text-left font-semibold transition-all [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground h-5 w-5 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn('px-4 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
