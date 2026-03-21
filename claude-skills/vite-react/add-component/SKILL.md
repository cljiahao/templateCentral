---
name: add-component
description: Use when creating a new React component and unsure whether it belongs in features/, widgets/, or layout/, or when adding a shared component with barrel exports.
---

# Add a Component

Create a new component in a Vite + React project scaffolded from templateCentral.

## Inputs

- **Component name** — PascalCase name (e.g., `StatusBadge`, `UserAvatar`)
- **Component type** — Where it belongs (feature, widget, layout)

## Decision Guide

First, determine where the component belongs:

| Scenario | Location | Example |
|----------|----------|---------|
| Used by one feature only | `src/features/<name>/components/` | `ProjectCard` in `features/project` |
| Used by 2+ features | `src/components/widgets/` | `StatusBadge` used by project + dashboard |
| Low-level primitive | `src/components/ui/` (use shadcn CLI) | `Button`, `Input`, `Dialog` |
| App shell | `src/components/layout/` | `Navbar`, `SiteFooter` |

## Steps

### 1. Create the Component File

Use kebab-case for the filename, PascalCase for the export:

```tsx
// src/components/widgets/status-badge.tsx
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      status === 'active' && 'bg-emerald-100 text-emerald-800',
      status === 'inactive' && 'bg-gray-100 text-gray-800',
      status === 'pending' && 'bg-yellow-100 text-yellow-800',
      className
    )}>
      {status}
    </span>
  );
}
```

### 2. Export from Barrel

Add the export to the folder's `index.ts`:

```ts
// src/components/widgets/index.ts
export { StatusBadge } from './status-badge';
```

### 3. Adding a shadcn/ui Component

For low-level UI primitives, use the shadcn CLI:

```bash
npx shadcn@latest add <component-name>
```

This installs into `src/components/ui/`. The project has a `components.json` with `rsc: false` for Vite compatibility. Do not manually create UI primitives.

## Component Patterns

### Use `function` declarations (default)
```tsx
export function StatusBadge({ status }: Props) {
  return <span className="rounded-full px-2 py-1 text-xs">{status}</span>;
}
```

### Use `React.memo` only when proven necessary
```tsx
export const ExpensiveList = React.memo(
  function ExpensiveList({ items }: Props) {
    return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
  }
);
```

### Props: composition over configuration
Instead of boolean flags:
```tsx
// Avoid
<Card variant="outlined" showHeader showFooter hasIcon />

// Prefer
<Card>
  <CardHeader><Icon /><Title /></CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

### Static data in constants, not in components
```ts
// constants.ts
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

// component.tsx
import { STATUS_OPTIONS } from '../constants';
```

### 4. Validate

```bash
pnpm build && pnpm test
```

Confirm the build succeeds with no type errors and all tests pass.

## Rules

All `code-standards/` rules apply. Key rules for components:

- Always add to barrel `index.ts` when creating in shared folders — NEVER omit the barrel export
- Don't prematurely extract — keep inline until a second consumer needs it; NEVER extract into `widgets/` until it has a second consumer
- Don't use React.memo/useCallback/useMemo unless profiling confirms a problem (exception: context providers — see `code-standards`)
- NEVER manually create files in `src/components/ui/` — use the shadcn CLI (`npx shadcn@latest add`)
- NEVER add boolean flag props to configure variants — prefer composition with children
- NEVER put data-fetching logic in components — use hooks from the feature's `hooks/` folder
