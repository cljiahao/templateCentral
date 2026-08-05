<!-- ref: add/pagination/nextjs.md
     loaded-by: add/SKILL.md
     prereq: Stack = nextjs. Do not invoke this file directly — it is loaded at runtime by the templatecentral:add skill. -->
### Next.js (TypeScript + Drizzle + Zod)

### Step 0 — Verify context

Look for `<!-- templateCentral: nextjs@` on line 1 of `AGENTS.md`.

If found → proceed to Step 1.

If not found → invoke `templatecentral:migrate`. Once complete, re-check for
the marker.
- Marker now present → proceed to Step 1.
- Still absent (user chose to stop) → exit. Do not generate any files.

**1. Reusable Pagination Schema (From validation-patterns)**

```ts
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .pipe(z.coerce.number().int().positive('Page must be 1 or greater')),
  limit: z
    .string()
    .default('10')
    .pipe(
      z.coerce.number().int().min(1, 'Limit must be 1 or greater').max(100, 'Limit must be 100 or less')
    ),
  sort: z
    .string()
    .regex(/^(asc|desc)_\w+$/, 'Invalid sort format: use asc_fieldName or desc_fieldName')
    .optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
```

**2. Pagination Response Type**

```ts
// src/lib/types/pagination.ts
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    items: T[];
    pagination: PaginationMetadata;
  };
}
```

**3. Pagination Helpers (Business Logic)**

```ts
// src/lib/pagination/pagination-service.ts
import { PaginationMetadata } from '@/lib/types/pagination';

// Pages are 1-indexed in the API surface, 0-indexed at the query layer
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function createMetadata(page: number, limit: number, total: number): PaginationMetadata {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}

// Returns null for any sort string that is malformed or names a field outside
// allowedFields — the whitelist is what keeps the value out of the ORM's orderBy.
// Callers map the returned field/direction to their own ORM column.
export function parseSortParam(
  sort: string | undefined,
  allowedFields: string[]
): { field: string; direction: 'asc' | 'desc' } | null {
  if (!sort) return null;

  // Split on the FIRST underscore only — field names may be snake_case (e.g. desc_created_at)
  const separatorIndex = sort.indexOf('_');
  if (separatorIndex === -1) return null;
  const direction = sort.slice(0, separatorIndex);
  const field = sort.slice(separatorIndex + 1);
  if (!allowedFields.includes(field) || !['asc', 'desc'].includes(direction)) {
    return null;
  }

  return { field, direction: direction as 'asc' | 'desc' };
}
```

**4. API Route with Pagination**

```ts
// src/app/api/projects/route.ts
import { handleApiError } from '@/lib/errors';
import { withLogging } from '@/lib/utils/with-logging';
import { paginationSchema } from '@/lib/validation/schemas';
import { calculateOffset, createMetadata, parseSortParam } from '@/lib/pagination/pagination-service';
import { NextResponse } from 'next/server';
import { asc, count, desc } from 'drizzle-orm';
import { db, projects } from '@/integrations/database';

const ALLOWED_SORT_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;
type SortField = typeof ALLOWED_SORT_FIELDS[number];

const SORT_COLUMNS: Record<SortField, typeof projects.name | typeof projects.createdAt | typeof projects.updatedAt> = {
  name: projects.name,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

export const GET = withLogging(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    // searchParams.get() returns null for missing params, but z.string().default()
    // only fires on undefined — coalesce to undefined so defaults apply.
    const queryParams = {
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    };

    const parsed = paginationSchema.safeParse(queryParams);
    if (!parsed.success) {
      // ZodError branch of handleApiError derives fieldErrors itself — no third argument needed
      return handleApiError('Invalid query parameters', parsed.error);
    }

    const { page, limit, sort } = parsed.data;

    const sortParam = parseSortParam(sort, [...ALLOWED_SORT_FIELDS]);
    if (sort && !sortParam) {
      return NextResponse.json(
        {
          error: 'Invalid sort field',
          details: { fieldErrors: { sort: [`Must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`] } },
        },
        { status: 400 }
      );
    }

    const orderByCol = sortParam
      ? sortParam.direction === 'asc'
        ? asc(SORT_COLUMNS[sortParam.field as SortField])
        : desc(SORT_COLUMNS[sortParam.field as SortField])
      : desc(projects.createdAt);

    const offset = calculateOffset(page, limit);
    const [rows, [{ total }]] = await Promise.all([
      db
        .select({ id: projects.id, name: projects.name, description: projects.description })
        .from(projects)
        .orderBy(orderByCol)
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(projects),
    ]);

    return NextResponse.json({
      data: {
        items: rows,
        pagination: createMetadata(page, limit, Number(total)),
      },
    });
  } catch (error) {
    return handleApiError('Failed to fetch projects', error);
  }
});
```

**5. Paginated UI Component (React)**

```tsx
// src/features/projects/components/projects-list.tsx
'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { APIError } from '@/integrations/error';

const PAGE_SIZE = 10;

const projectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});

type ProjectItem = z.infer<typeof projectItemSchema>;

// Mirrors the envelope the route above returns: { data: { items, pagination } }
const paginatedProjectsSchema = z.object({
  data: z.object({
    items: z.array(projectItemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      hasMore: z.boolean(),
    }),
  }),
});

async function fetchProjects(page: number, limit: number) {
  const response = await fetch(`/api/projects?page=${page}&limit=${limit}&sort=asc_name`);

  if (!response.ok) {
    throw new APIError({
      statusCode: response.status,
      data: await response.json().catch(() => ({ message: 'Failed to fetch projects' })),
    });
  }

  const json: unknown = await response.json();

  const parsed = paginatedProjectsSchema.safeParse(json);
  if (!parsed.success) {
    throw new APIError({
      statusCode: 502,
      data: { message: 'Received an unexpected response from the server.' },
    });
  }

  return parsed.data.data;
}

export function ProjectsList() {
  const [page, setPage] = useState(1);

  const { data, isPending, isFetching, error } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page, PAGE_SIZE),
    // The page number is part of the queryKey, so every Next/Previous click is a
    // cache miss. Without this, isPending flips true and the whole list unmounts
    // and re-mounts on each click. keepPreviousData holds the previous page's rows
    // on screen (with isFetching true) until the new page resolves.
    placeholderData: keepPreviousData,
  });

  // isPending is true only for the very first load — with keepPreviousData a page
  // change keeps the previous rows mounted and surfaces as isFetching instead.
  if (isPending) return <div>Loading...</div>;
  if (error) return <div role="alert">Failed to load projects.</div>;

  const { items: projects, pagination } = data;

  return (
    <div className="space-y-4">
      <ul className={isFetching ? 'space-y-2 opacity-60 transition-opacity' : 'space-y-2'}>
        {projects.map((project: ProjectItem) => (
          <li key={project.id} className="rounded border p-2">
            <h3 className="font-bold">{project.name}</h3>
            {project.description && (
              <p className="text-muted-foreground text-sm">{project.description}</p>
            )}
          </li>
        ))}
      </ul>

      <nav aria-label="Pagination" className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            disabled={page === 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>

          <span>
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>

          <Button
            variant="outline"
            disabled={!pagination.hasMore || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>

        <div aria-live="polite" className="text-muted-foreground text-sm">
          Showing {(page - 1) * pagination.limit + 1} to{' '}
          {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
        </div>
      </nav>
    </div>
  );
}
```

## Validate

```bash
# Test pagination endpoint
curl 'http://localhost:3000/api/projects?page=1&limit=10'

# Expected 200 response:
# {
#   "data": {
#     "items": [{ "id": "1", "name": "Project A" }, ...],
#     "pagination": { "page": 1, "limit": 10, "total": 247, "hasMore": true }
#   }
# }

# Test invalid page
curl 'http://localhost:3000/api/projects?page=0&limit=10'
# Expected 400 response with validation error

# Test limit exceeds max
curl 'http://localhost:3000/api/projects?page=1&limit=200'
# Expected 400 response (limit exceeds 100)

# Test invalid sort field
curl 'http://localhost:3000/api/projects?page=1&limit=10&sort=asc_invalid'
# Expected 400 response (field not in whitelist)

pnpm test
pnpm build
```

## Rules

- Always set `placeholderData: keepPreviousData` on a paginated query — without it every page click blanks the list
- Drive loading/disabled UI off `isFetching` for page changes; `isPending` covers only the first load
- Validate the response with Zod `safeParse` and derive the row type from the schema — never hand-roll a type guard or re-declare the row shape alongside it
- Always throw `APIError` (imported from `@/integrations/error`, not `@/lib/errors` — that barrel pulls server-only modules into the client bundle), never a generic `Error`
- Whitelist every sortable field before it reaches the ORM's `orderBy` — `parseSortParam` returns `null` for anything outside the list
- Use the shadcn `Button` for pagination controls — never a raw `<button>`

## See Also

- `templatecentral:add` (error-handling) — Pagination errors use unified error response schema
- `templatecentral:standards` (validation-patterns) — Pagination query params validated with Zod
- `templatecentral:add (endpoint)` — Add pagination to new list endpoints
- Stack-specific `code-standards` — Database indexing best practices for sort fields

## After Writing Code

Dispatch in order:
1. the build utility — load it with: `cat "<skill-dir>/../build/SKILL.md"` — validate compilation
2. the review utility — load it with: `cat "<skill-dir>/../review/SKILL.md"` — check code standards