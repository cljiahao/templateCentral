'use client';

import { cloneElement, type ReactElement } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

interface CustomFormFieldProps {
  name: string;
  label: string;
  description?: string;
  children: ReactElement<Record<string, unknown>>;
}

export function CustomFormField({
  name,
  label,
  description,
  children,
}: CustomFormFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, ...field }, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            htmlFor={name}
            className="text-foreground text-lg leading-tight font-semibold tracking-tight"
          >
            {label}
          </FieldLabel>
          {cloneElement(children, {
            id: name,
            ref,
            'aria-invalid': fieldState.invalid,
            ...field,
          })}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
