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
        const body = await response.json();
        setError(body.error || 'Login failed');
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
          {...register('email')}
          className="w-full rounded border px-3 py-2"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="w-full rounded border px-3 py-2"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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

// A hard ceiling on `limit` is what stops a client from asking for the whole table
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

export const GET = withLogging(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    // searchParams.get() returns null for missing params, but z.string().default()
    // only fires on undefined — coalesce to undefined so defaults apply.
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
    const projects = [];

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

```ts
// src/integrations/services/github-service.ts
import { z } from 'zod';
import { APIError } from '@/integrations/error';

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

  const data = await response.json();

  // Validate response matches schema
  const parsed = externalApiUserSchema.safeParse(data);

  if (!parsed.success) {
    throw new APIError({ statusCode: 502, data: { message: 'Invalid GitHub API response' } });
  }

  // Safe to use: parsed.data has required fields
  return {
    id: parsed.data.id,
    email: parsed.data.email,
  };
}
```

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

## After Writing Code

Dispatch in order:
1. the build utility — load it with: `cat "<skill-dir>/../build/SKILL.md"` — validate compilation
2. the review utility — load it with: `cat "<skill-dir>/../review/SKILL.md"` — check code standards