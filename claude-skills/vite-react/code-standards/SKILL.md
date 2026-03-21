---
name: code-standards
description: Use when writing or reviewing any code in a Vite + React project — covers file naming, export style, function vs const, component placement, and performance rules.
---

# Vite + React Code Standards

Coding standards and conventions for Vite + React SPA projects scaffolded from templateCentral. Follow these rules when writing or reviewing code.

## File Naming

All files use **kebab-case** (lowercase, hyphen-separated). No exceptions — unlike Next.js, Vite has no special file naming conventions.

## Exports & Variable Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components, classes | PascalCase | `DashboardHeader`, `APIError` |
| Functions, hooks, variables | camelCase | `useUploadForm`, `projectFormSchema` |
| Constants | UPPER_SNAKE_CASE | `STATUS_OPTIONS`, `API_ROUTES` |
| Types/interfaces | PascalCase | `ProjectItem`, `ExampleCardProps` |

**Always use named exports.** Never use `export default` in application code. Exception: build/tooling config files (`vite.config.ts`, `eslint.config.mjs`) that require a default export.

## Function vs Const

| Pattern | When to use |
|---------|-------------|
| `export function Foo() {}` | Default — most components |
| `export const Foo = React.memo(function Foo() {})` | Components that need memoization |
| `const foo = () => {}` | Hooks, utilities, helpers, internal sub-components |

### Components — use `function` declarations
```tsx
export function CustomCard({ children }: Props) {
  return <div className="rounded-lg border p-6">{children}</div>;
}
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
| Low-level primitive | `src/components/ui/` (use `npx shadcn@latest add`) |
| App shell (nav, footer, layout) | `src/components/layout/` |

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

## Environment Variables

Access environment variables via `import.meta.env.VITE_*`, centralized in `src/lib/constants/env.ts`:

```ts
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string | undefined,
  IS_DEV: import.meta.env.DEV,
} as const;
```

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

## Testing

- **Vitest** for all tests — NEVER use Jest in Vite projects
- **Testing Library** (`@testing-library/react`) for component tests
- Co-locate test files next to source: `example-service.test.ts`, `example-card.test.tsx`
- Use `.test.ts` suffix for unit tests, `.test.tsx` for component tests
- Globals enabled (`describe`, `it`, `expect` available without imports, but explicit imports are fine)

## Rules

- **kebab-case** filenames, **PascalCase** components, **camelCase** functions/hooks
- Named exports only — NEVER use `export default`
- **`function` declarations** for components, `const` arrows for hooks/utilities
- **Barrel exports** for features — `import { X } from '@/features/<name>'` (NEVER deep-import)
- **`import.meta.env.VITE_*`** for env vars (NEVER `process.env`), centralized in `src/lib/constants/env.ts`
- **Thin components** — delegate logic to hooks and services; NEVER put business logic in components
- **Client-only SPA** — NEVER add server-side code (SSR, API route handlers, RSC)
- NEVER use `React.memo`, `useCallback`, or `useMemo` without profiling evidence. **Exception**: `useMemo`/`useCallback` are appropriate in React context providers to stabilize the context value and prevent unnecessary re-renders of all consumers
- NEVER use `any` — use `unknown` and narrow with type guards
- NEVER use inline styles — use Tailwind classes
