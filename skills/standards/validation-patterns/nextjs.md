<!-- ref: standards/validation-patterns/nextjs.md
     loaded-by: standards/SKILL.md
     prereq: Stack = nextjs. Do not invoke this file directly — it is loaded at runtime by the templatecentral:standards skill. -->
### Next.js (TypeScript + React + Zod)

**1. Form Schema with Client & Server Validation**

```ts
// src/features/auth/schemas/login-form.ts
import { z } from 'zod';

export const LoginFormSchema = z.object({
  email: z
    .email({ error: 'Invalid email address' })
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.input<typeof LoginFormSchema>;
```

**2. React Hook Form + Client Validation**

```tsx
// src/features/auth/components/login-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { LoginFormSchema, type LoginFormData } from '../schemas/login-form';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // The backend's error text is for engineers, not users — it can carry stack
        // traces, SQL fragments, or internal identifiers. Log it, show a fixed string.
        const body = await response.json().catch(() => ({}));
        console.error('Login failed', body.error ?? response.status);
        setError('Login failed. Check your credentials and try again.');
        return;
      }

      // router.push, never window.location.href — a full document reload discards
      // the App Router cache and client state
      router.push('/dashboard');
    } catch (err) {
      console.error('Login request failed', err);
      setError('An unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="user@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
          className="w-full rounded border px-3 py-2"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
          className="w-full rounded border px-3 py-2"
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

**3. Server Action with Zod Validation**

```ts
// src/features/auth/actions/login.ts
'use server';

import { z } from 'zod';
import { LoginFormSchema } from '../schemas/login-form';

export async function loginAction(formData: unknown) {
  // Re-validate server-side. The client-side resolver is UX only — a crafted
  // request reaches this action with arbitrary input.
  const parsed = LoginFormSchema.safeParse(formData);

  if (!parsed.success) {
    // Server actions return a plain serializable value to the caller, not an HTTP
    // response — this is why it does not use handleApiError like the routes below
    return {
      error: 'Validation failed',
      details: {
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
        code: 'VALIDATION_ERROR',
      },
    };
  }

  // Call your auth logic here using parsed.data

  return { success: true };
}
```

**4. API Route with Request Body Validation**

> **Never name a route segment under `/api/auth/`.** With `templatecentral:add (auth)` installed, better-auth owns the catch-all at `src/app/api/auth/[...all]/route.ts`. A static sibling like `src/app/api/auth/login/route.ts` takes precedence over the catch-all and would silently bypass better-auth's own handling and rate limiting for that path. This example uses `/api/sessions` for that reason.

```ts
// src/app/api/sessions/route.ts
import { handleApiError } from '@/lib/errors';
import { withLogging } from '@/lib/utils/with-logging';
import { LoginFormSchema } from '@/features/auth/schemas/login-form';
import { NextResponse } from 'next/server';

export const POST = withLogging(async (request) => {
  try {
    const body = await request.json();
    const parsed = LoginFormSchema.safeParse(body);

    if (!parsed.success) {
      // handleApiError's ZodError branch emits the 400 + fieldErrors + VALIDATION_ERROR
      // shape — never hand-roll it, or the error contract drifts per route
      return handleApiError('Login failed', parsed.error);
    }

    // Call your auth logic here using parsed.data

    return NextResponse.json({ data: { success: true } }, { status: 200 });
  } catch (error) {
    return handleApiError('Login failed', error);
  }
});
```

**5. Query Parameter Validation**

```ts
// src/app/api/projects/route.ts
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';
import { withLogging } from '@/lib/utils/with-logging';
import { NextResponse } from 'next/server';

// A hard ceiling on `limit` is what stops a client from asking for the whole table.
// Simplified for illustration — the canonical schema (with per-rule error messages and
// a sort-format regex) lives in `src/lib/validation/schemas.ts` via
// `templatecentral:add (pagination)`. Keep the bounds and defaults identical.
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().optional(),
});

export const GET = withLogging(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    // searchParams.get() returns null for missing params. `.default()` only fires on
    // undefined, and z.coerce.number() would turn that null into 0 and fail min(1) —
    // coalesce to undefined so the defaults apply.
    const queryObj = {
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    };

    const parsed = paginationSchema.safeParse(queryObj);

    if (!parsed.success) {
      return handleApiError('Invalid query parameters', parsed.error);
    }

    // Use parsed.data.page, parsed.data.limit, parsed.data.sort
    const projects: unknown[] = [];

    return NextResponse.json({ data: projects });
  } catch (error) {
    return handleApiError('Failed to fetch projects', error);
  }
});
```

> `sort` must be checked against a field whitelist before it reaches an ORM `orderBy` — a bare string here is not yet safe to interpolate into a query. `templatecentral:add (pagination)` provides `parseSortParam` for exactly this.

**6. File Upload Validation**

`file.name` and `file.type` are attacker-controlled strings, not facts about the bytes. Schema validation of them is a usability filter, never the security control. Three things the schema cannot do for you:

- **Enforce a size ceiling before buffering.** `await request.formData()` pulls the whole body into memory; checking `file.size` afterwards is too late to stop a memory-exhaustion DoS. Reject on `Content-Length` first, and configure the same ceiling at the platform edge (`next.config.ts` body size limit / CDN / reverse proxy), which is the only limit an attacker cannot skip.
- **Verify the content is what it claims.** A `.pdf` name with `application/pdf` in `file.type` can carry arbitrary bytes. Sniff the magic bytes of the buffer and confirm they match the allowed type before storing or serving the file.
- **Make the filename safe.** NEVER derive a storage key or filesystem path from `file.name` — it can contain `../`, null bytes, or a name that collides with an existing object. Generate the storage key yourself (e.g. a UUID) and keep the original name as metadata only.

```ts
// src/app/api/upload/route.ts
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';
import { withLogging } from '@/lib/utils/with-logging';
import { NextResponse } from 'next/server';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'] as const;

// Claimed metadata only — see the magic-byte check below for the real gate
const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  type: z.enum(ALLOWED_TYPES),
});

// Leading signature bytes per allowed type. For formats beyond these, use a
// maintained detector (e.g. file-type) rather than extending this by hand.
const MAGIC_BYTES: Record<(typeof ALLOWED_TYPES)[number], number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

function matchesDeclaredType(buffer: ArrayBuffer, type: (typeof ALLOWED_TYPES)[number]): boolean {
  const signature = MAGIC_BYTES[type];
  const head = new Uint8Array(buffer, 0, signature.length);
  return signature.every((byte, i) => head[i] === byte);
}

export const POST = withLogging(async (request) => {
  try {
    // Reject oversized bodies BEFORE formData() buffers them into memory
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const parsed = fileUploadSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!parsed.success) {
      return handleApiError('Invalid file', parsed.error);
    }

    const buffer = await file.arrayBuffer();

    // Verify the bytes match the claimed type — file.type is client-supplied
    if (!matchesDeclaredType(buffer, parsed.data.type)) {
      return NextResponse.json({ error: 'File content does not match its type' }, { status: 400 });
    }

    // Generate the storage key — never build a path from parsed.data.name
    const storageKey = crypto.randomUUID();
    // Call your storage upload logic here using storageKey and buffer

    return NextResponse.json(
      { url: `https://example.com/files/${storageKey}` },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError('Upload failed', error);
  }
});
```

**7. External API Response Validation**

The validation shape below is what matters here. For the full integration layer — client, service, factory, and env wiring — use `templatecentral:add (integration)`, which owns `src/integrations/services/github-service.ts`.

```ts
// src/integrations/services/github-user.ts
import { z } from 'zod';
import { APIError } from '@/integrations/error';
import { logError } from '@/lib/errors';

const externalApiUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  email: z.email().nullable(),
});

export async function fetchGithubUser(username: string) {
  // Encode every interpolated segment — an unencoded `../` walks off the intended path
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);

  if (!response.ok) {
    // Integration layer always throws APIError — never generic Error
    throw new APIError({ statusCode: response.status, data: { message: 'GitHub API error' } });
  }

  const data: unknown = await response.json();

  const parsed = externalApiUserSchema.safeParse(data);

  if (!parsed.success) {
    // Field errors are a debugging aid, not a user-facing message — log them, and
    // throw the generic APIError the rest of the app already knows how to render.
    logError(
      'fetchGithubUser: response failed schema validation',
      new Error(JSON.stringify(z.flattenError(parsed.error).fieldErrors))
    );
    throw new APIError({ statusCode: 502, data: { message: 'Invalid GitHub API response' } });
  }

  return {
    id: parsed.data.id,
    email: parsed.data.email,
  };
}
```

## Rules

- Schemas live in `schemas/` — NEVER define or export a schema from a component file
- Always re-validate on the server; the client-side resolver is UX only and a crafted request skips it entirely
- Always validate route params / query values with Zod before use, and `encodeURIComponent` any value interpolated into a path
- Route failures go through `handleApiError` — NEVER hand-roll the error body, or the error contract drifts per route
- Throw `APIError`, never a generic `Error` — and never embed validation field detail in the thrown message
- NEVER render a backend error string to the user — log it, show a fixed generic message
- Every input needs `aria-invalid` and an `aria-describedby` pointing at its `role="alert"` error node

## Testing / Verification

```bash
# Test form validation (client-side error before server)
pnpm dev
# Fill form incorrectly, verify errors appear

# Test API validation (server-side)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'  # Should return 400

pnpm test
```

## See Also

- `templatecentral:add` (error-handling) — Transform validation errors to consistent response format
- `templatecentral:add` (logging) — Log validation failures with context
- Stack-specific `code-standards` — Type annotation and schema standards
- `templatecentral:add (endpoint)` / `templatecentral:add (form)` — Use validation patterns in new routes/forms

## After Writing Code

Dispatch in order:
1. the build utility — load it with: `cat "<skill-dir>/../build/SKILL.md"` — validate compilation
2. the review utility — load it with: `cat "<skill-dir>/../review/SKILL.md"` — check code standards