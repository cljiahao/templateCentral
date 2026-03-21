---
name: code-standards
description: Use when writing or reviewing any code in a Next.js project — covers file naming, export style, function vs const, component placement, and performance rules.
---

# Next.js Code Standards

Coding standards and conventions for Next.js projects scaffolded from templateCentral. Follow these rules when writing or reviewing code.

## File Naming

All files use **kebab-case** (lowercase, hyphen-separated).

### Exceptions (Next.js special files)
- `layout.tsx`, `page.tsx`, `route.ts`, `not-found.tsx`, `loading.tsx`, `error.tsx`, `template.tsx`
- Dynamic route segments: `[id]`, `[...slug]`

## Exports & Variable Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components, classes | PascalCase | `UploadService`, `DashboardHeader` |
| Functions, hooks, variables | camelCase | `useUploadForm`, `projectFormSchema` |
| Constants | UPPER_SNAKE_CASE | `FRAMEWORK_OPTIONS`, `AVATAR_COLOR_MAP` |
| Types/interfaces | PascalCase | `ProjectFormSchema`, `UploadMode` |

**Always use named exports.** Never use `export default` except where required by Next.js (pages, layouts, config files).

## Function vs Const

| Pattern | When to use |
|---------|-------------|
| `export function Foo() {}` | Default — most components |
| `export const Foo = React.memo(function Foo() {})` | Components that need memoization |
| `const foo = () => {}` | Hooks, utilities, helpers, internal sub-components |

### Components — use `function` declarations
```tsx
export function CustomCard({ children }: Props) {
  return <Card>{children}</Card>;
}
```

### Memoized components — use `const` with named function inside
```tsx
export const FrameworkSelector = React.memo(
  function FrameworkSelector({ ... }: Props) {
    return (...);
  }
);
```

### Hooks, utilities, helpers — use `const` with arrow functions
```ts
const formatDate = (date: Date) => date.toISOString();

const useUploadForm = () => {
  // ...
};
```

## Component Best Practices

- **Keep components thin** — focus on rendering, delegate logic to hooks/services
- **Extract when there's a second consumer** — don't prematurely extract
- **Props: prefer composition over configuration** — split instead of adding boolean flags

### Component Placement Decision Guide

| Scenario | Location |
|----------|----------|
| Used by one feature | `src/features/<name>/components/` |
| Used by 2+ features | `src/components/widgets/` |
| Low-level primitive | `src/components/ui/` (via shadcn CLI) |
| App shell (nav, footer, theme) | `src/components/layout/` |

## Performance

**Do NOT use React.memo, useCallback, useMemo by default.** Only after profiling confirms a problem.

They form a **chain** — must be used together to be effective:
1. Parent stabilizes handlers with `useCallback`
2. Child wrapped with `React.memo`
3. Using any of them in isolation adds overhead for zero gain

## Data & Rendering Separation

- Static data belongs in `constants.ts`
- Components only handle rendering
- Static arrays, configuration objects, option lists → feature's `constants.ts`

## Utility Classes

The template provides these shared utilities:

- **`cn()`** — Class merging utility (`clsx` + `tailwind-merge`) in `src/lib/utils/index.ts`. Use for conditional class composition
- **`flex-center`** — Custom CSS utility (defined in `globals.css`) for `display: flex; align-items: center; justify-content: center`
- **`flex-between`** — Custom CSS utility for `display: flex; align-items: center; justify-content: space-between`
- **`max-w-site`** — Custom max-width utility for consistent page-width containers

## Barrel Exports

- Each feature and shared folder has an `index.ts` re-exporting the public API
- **Prefer**: `import { ProjectService } from '@/features/project'`
- **Avoid**: `import { ProjectService } from '@/features/project/api/project-service'`
- Direct imports are OK within the same feature

## Rules

- **kebab-case** filenames, **PascalCase** components, **camelCase** functions/hooks
- **Named exports** always — NEVER use `export default` except where Next.js requires it (pages, layouts, config files)
- **`function` declarations** for components, `const` arrows for hooks/utilities
- **Barrel exports** for features — `import { X } from '@/features/<name>'`. NEVER deep-import from features
- **Static data** in `constants.ts`, NEVER inline in components
- **Thin components** — delegate logic to hooks and services. NEVER put business logic in components
- NEVER use `React.memo`, `useCallback`, or `useMemo` without profiling evidence — they add overhead in isolation. **Exception**: `useMemo`/`useCallback` are appropriate in React context providers to stabilize the context value and prevent unnecessary re-renders of all consumers
- NEVER use `any` — use `unknown` and narrow with type guards
- NEVER use inline styles — use Tailwind classes
