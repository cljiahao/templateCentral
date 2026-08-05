<!-- ref: add/pagination/vite-react.md
     loaded-by: add/SKILL.md
     prereq: Stack = vite-react. Do not invoke this file directly — it is loaded at runtime by the templatecentral:add skill. -->
### Vite + React (TypeScript + React Query)

### Step 0 — Verify context

Look for `<!-- templateCentral: vite-react@` on line 1 of `AGENTS.md`.

If found → proceed to Step 1.

If not found → invoke `templatecentral:migrate`. Once complete, re-check for
the marker.
- Marker now present → proceed to Step 1.
- Still absent (user chose to stop) → exit. Do not generate any files.

**1. Pagination Hook**

```ts
// src/hooks/use-pagination.ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function usePagination<T>(
  queryKey: string[],
  fetchFn: (page: number, limit: number) => Promise<{
    items: T[];
    pagination: { page: number; limit: number; total: number; hasMore: boolean };
  }>,
  options: UsePaginationOptions = {}
) {
  const { initialPage = 1, pageSize = 10, enabled = true } = options;
  const [page, setPage] = useState(initialPage);

  const { data, isPending, error, isFetching } = useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => fetchFn(page, pageSize),
    enabled,
    // The page number is part of the queryKey, so every Next/Previous click is a
    // cache miss. Without this, isPending flips true and the whole list unmounts
    // and re-mounts on each click. keepPreviousData holds the previous page's rows
    // on screen (with isFetching true) until the new page resolves.
    placeholderData: keepPreviousData,
  });

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    if (data?.pagination?.hasMore) {
      setPage((p) => p + 1);
    }
  }, [data]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  return {
    data: data?.items || [],
    pagination: data?.pagination,
    page,
    pageSize,
    isPending,
    isFetching,
    error,
    goToPage,
    nextPage,
    prevPage,
  };
}
```

**2. Export from the hooks barrel**

Add to `src/hooks/index.ts` — shared hooks are always re-exported from the barrel:

```ts
export { usePagination } from './use-pagination';
```

**3. Projects List Component**

```tsx
// src/features/projects/components/projects-list.tsx
import { Button } from '@/components/ui/button';
import { fetchProjects, type ProjectItem } from '@/features/projects/api/projects';
import { usePagination } from '@/hooks';

export function ProjectsList() {
  const { data, pagination, page, isPending, isFetching, error, nextPage, prevPage } =
    usePagination<ProjectItem>(['projects'], fetchProjects);

  // isPending is true only for the very first load — with keepPreviousData a page
  // change keeps the previous rows mounted and surfaces as isFetching instead.
  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Failed to load projects.</div>;

  return (
    <div className="space-y-4">
      <ul className={isFetching ? 'space-y-2 opacity-60 transition-opacity' : 'space-y-2'}>
        {data.map((project: ProjectItem) => (
          <li key={project.id} className="rounded border p-2">
            <h3 className="font-bold">{project.name}</h3>
            {project.description && (
              <p className="text-muted-foreground text-sm">{project.description}</p>
            )}
          </li>
        ))}
      </ul>

      {pagination && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Button onClick={prevPage} disabled={page === 1 || isFetching}>
              Previous
            </Button>

            <span>
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>

            <Button onClick={nextPage} disabled={!pagination.hasMore || isFetching}>
              Next
            </Button>
          </div>

          <div className="text-muted-foreground text-sm">
            Showing {(page - 1) * pagination.limit + 1} to{' '}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
        </div>
      )}
    </div>
  );
}
```

**4. API Client**

```ts
// src/features/projects/api/projects.ts
import { getApiBaseUrl } from '@/lib/constants/env';
import { APIError, logError } from '@/lib/errors';
import { z } from 'zod';

const projectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});

export type ProjectItem = z.infer<typeof projectItemSchema>;

const paginatedProjectSchema = z.object({
  items: z.array(projectItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
});

export async function fetchProjects(
  page: number = 1,
  limit: number = 10
): Promise<z.infer<typeof paginatedProjectSchema>> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/projects?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new APIError({ statusCode: response.status, data: await response.json().catch(() => ({ message: 'Failed to fetch projects' })) });
  }

  const json: unknown = await response.json();

  // ADJUST TO YOUR BACKEND. This assumes list responses are wrapped in an envelope —
  // { data: { items: [...], pagination: {...} } } — which is a convention, not a
  // universal shape. If your API returns { items, pagination } directly, delete the
  // unwrap and validate `json` itself; the schema is the contract either way.
  const payload = unwrapEnvelope(json);

  const parsed = paginatedProjectSchema.safeParse(payload);
  if (!parsed.success) {
    // Field errors are a debugging aid, not a user-facing message — log them, and
    // throw the generic APIError the rest of the app already knows how to render.
    logError(
      'fetchProjects: response failed schema validation',
      new Error(JSON.stringify(z.flattenError(parsed.error).fieldErrors))
    );
    throw new APIError({
      statusCode: 502,
      data: { message: 'Received an unexpected response from the server.' },
    });
  }

  return parsed.data;
}

function unwrapEnvelope(json: unknown): unknown {
  return json && typeof json === 'object' && 'data' in json ? json.data : json;
}
```

## Validate

```bash
pnpm dev

# Component renders paginated list with prev/next controls
# Clicking next fetches page 2
# Previous button disabled on page 1
# hasMore correctly controls Next button state

pnpm test
```

## Rules

- Always set `placeholderData: keepPreviousData` on a paginated query — without it every page click blanks the list
- Drive loading/disabled UI off `isFetching` for page changes; `isPending` covers only the first load
- Always throw `APIError`, never a generic `Error` — and never embed validation field errors in the thrown message; log them separately
- Always add the hook to the `src/hooks/index.ts` barrel
- Use the shadcn `Button` for pagination controls — never a raw `<button>`

## See Also

- `templatecentral:add` (error-handling) — Pagination errors use unified error response schema
- `templatecentral:standards` (validation-patterns) — Pagination query params validated with Zod/Pydantic
- `templatecentral:add (endpoint)` — Add pagination to new list endpoints
- Stack-specific `code-standards` — Database indexing best practices for sort fields

## After Writing Code

Dispatch in order:
1. the build utility — load it with: `cat "<skill-dir>/../build/SKILL.md"` — validate compilation
2. the review utility — load it with: `cat "<skill-dir>/../review/SKILL.md"` — check code standards