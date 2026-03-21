---
name: add-api-route
description: Use when the user needs a new server-side API endpoint under src/app/api/, wants to add GET/POST/PUT/DELETE handlers, or needs a dynamic [id] route.
---

# Add an API Route

Create a new API route handler in a Next.js project scaffolded from templateCentral.

## Inputs

- **Resource name** — The API resource (e.g., `projects`, `users`)
- **HTTP methods** — Which methods to support (GET, POST, PUT, DELETE, PATCH)

## Steps

### 1. Create the Route File

API routes live in `src/app/api/`:

```
src/app/api/
├── route.ts                        # GET /api (health check)
├── <resource>/
│   ├── route.ts                    # GET, POST /api/<resource>
│   └── [id]/
│       └── route.ts               # GET, PUT, DELETE /api/<resource>/:id
```

### 2. Implement the Route Handler

Keep route handlers thin — delegate to server-side data access:

> **Important**: Route handlers run on the server. They access data via `integrations/factories` (which wire clients into services) — NOT through the feature's `api/` services, which use `fetch('/api/...')` and would cause the route to call itself recursively. Feature `api/` services are for client-side React Query hooks only. See the `add-integration` skill for how clients, services, schemas, and factories work.
>
> **Note**: `DB()` in the examples below is a placeholder. If the user needs database access, create a database client and service via the `add-integration` skill first (e.g., a Prisma client in `integrations/clients/`, a DB service in `integrations/services/`, and a `DB()` factory in `integrations/factories.ts`). Replace `DB()` with your actual factory name.

```ts
// src/app/api/projects/route.ts
import { handleApiError } from '@/lib/errors';
import { DB } from '@/integrations/factories';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projects = await DB().getAll();
    return NextResponse.json(projects);
  } catch (error) {
    return handleApiError('Failed to fetch projects', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Always validate with Zod before using — see Step 5
    const project = await DB().create(body);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError('Failed to create project', error);
  }
}
```

> **Note**: The POST example above is simplified. For production routes, always validate the request body with Zod (see Step 5) before passing it to services.

### 3. Dynamic Segments

For routes with resource IDs:

```ts
// src/app/api/projects/[id]/route.ts
import { handleApiError } from '@/lib/errors';
import { DB } from '@/integrations/factories';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const project = await DB().getById(id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return handleApiError('Failed to fetch project', error);
  }
}
```

### 4. Update Routes Constant

Add the new API route to `src/lib/constants/routes.ts`:

```ts
export const API_ROUTES = {
  // ... existing routes
  PROJECTS: '/api/projects',
  PROJECT_BY_ID: (id: string) => `/api/projects/${id}`,
} as const;
```

### 5. Validate Request Body with Zod

For POST/PUT endpoints, validate the incoming body:

```ts
import { z } from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const project = await DB().create(parsed.data);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError('Failed to create project', error);
  }
}
```

## Response Conventions

- **Success**: Return data with appropriate status code (200, 201)
- **Error**: Use `handleApiError()` which logs and returns consistent JSON error response
- **Not Found**: Return `{ error: 'Not found' }` with status 404
- **Validation**: Parse with Zod's `safeParse()` and return 400 with `error.flatten()` on failure

### 6. Validate

```bash
pnpm build
```

Confirm the build succeeds with no type errors. Verify the route responds correctly using `curl` or the browser.

## Rules

- Keep route handlers thin — delegate to services. NEVER put business logic in route handlers
- Always use `handleApiError()` for error responses — NEVER return raw error objects or stack traces
- Use `NextResponse.json()` for all responses
- Use dynamic segments `[id]` for resource IDs
- API routes are protected by `src/proxy.ts` by default — unauthenticated requests to non-public paths receive a 401 response automatically. Add route-level auth checks only when you need role-based or resource-level authorization beyond authentication
- NEVER use `request.json()` without validation — parse with Zod and return 400 on failure
- NEVER expose internal error details in responses — rely on `handleApiError()` for generic messages
- NEVER skip the routes constant — always add new API routes to `src/lib/constants/routes.ts`
