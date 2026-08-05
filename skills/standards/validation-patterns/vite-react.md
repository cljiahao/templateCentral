<!-- ref: standards/validation-patterns/vite-react.md
     loaded-by: standards/SKILL.md
     prereq: Stack = vite-react. Do not invoke this file directly — it is loaded at runtime by the templatecentral:standards skill. -->
### Vite + React (TypeScript + React Hook Form + Zod)

**1. Schemas live in `schemas/`, never in the component file**

A schema is data-shape policy, not view code. Keeping it in its own module is what lets a service, a test, and a form all validate against the same definition instead of drifting apart:

```ts
// src/features/projects/schemas/create-project.schema.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
});

export type CreateProjectData = z.input<typeof createProjectSchema>;
```

```ts
// src/features/auth/schemas/password.schema.ts
// Modern authenticator guidance: require length and screen against breached-password
// lists; do NOT impose character-composition rules. Long passphrases beat short complex
// strings. Canonical definition lives in standards/validation-patterns/patterns.md —
// keep these identical.
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters');
```

**2. Form Component with Validation**

```tsx
// src/features/projects/components/create-project-form.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CustomFormField } from '@/components/widgets';
import { getApiBaseUrl } from '@/lib/constants';
import { logError } from '@/lib/errors';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createProjectSchema, type CreateProjectData } from '../schemas/create-project.schema';

export function CreateProjectForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CreateProjectData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data: CreateProjectData) => {
    try {
      setSubmitError(null);
      const response = await fetch(`${getApiBaseUrl()}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        // The backend's error text is for engineers, not users — it can carry stack
        // traces, SQL fragments, or internal identifiers. Log it, show a fixed string.
        const body = await response.json().catch(() => ({}));
        logError('CreateProjectForm: create failed', new Error(String(body.error ?? response.status)));
        setSubmitError('Failed to create project. Please try again.');
        return;
      }

      // Success
    } catch {
      setSubmitError('An unexpected error occurred');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomFormField name="name" label="Name">
          <Input placeholder="Project name" />
        </CustomFormField>

        <CustomFormField name="description" label="Description">
          <Input placeholder="Project description (optional)" />
        </CustomFormField>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
        </Button>
      </form>
    </Form>
  );
}
```

`CustomFormField` (`src/components/widgets/custom-form-field.tsx`) takes `name`, `label`, optional `description`, and a single input child — it wires the Controller, label, and error message internally via `useFormContext()`. Do NOT wrap it in `FormField`/`FormControl`/`FormItem` or spread `{...field}` onto it.

**3. File Upload with Server-Side Validation (Critical)**

⚠️ **Important:** Client validation can be bypassed. Server-side validation is MANDATORY.

```tsx
// src/features/projects/components/file-upload-form.tsx
import { getApiBaseUrl } from '@/lib/constants';
import { type ChangeEvent, useState } from 'react';
import { z } from 'zod';

// Canonical definition lives in standards/validation-patterns/patterns.md (fileUploadSchema)
// — keep the extension whitelist and path-traversal checks identical; do not weaken.
const fileUploadSchema = z.object({
  name: z
    .string()
    .refine(
      (name) => {
        try {
          const decoded = decodeURIComponent(name);
          return (
            !decoded.includes('..') &&
            !decoded.startsWith('/') &&
            !decoded.startsWith('./') &&
            !decoded.includes('\x00')
          );
        } catch {
          return false;
        }
      },
      'Invalid filename'
    )
    .refine(
      (name) => {
        try {
          const decoded = decodeURIComponent(name);
          const ext = decoded.split('.').pop()?.toLowerCase();
          // Whitelist (Rule 5) — must stay in sync with the MIME whitelist below
          const allowed = ['jpg', 'jpeg', 'png', 'pdf'];
          return allowed.includes(ext || '');
        } catch {
          return false;
        }
      },
      'File type not allowed'
    ),
  size: z.number().max(10 * 1024 * 1024, 'File must be under 10MB'),
  type: z
    .string()
    .refine(
      (type) => ['image/jpeg', 'image/png', 'application/pdf'].includes(type),
      'File type must be JPEG, PNG, or PDF'
    ),
});

export function FileUploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setIsUploading(true);

      // Client-side validation (user feedback only)
      const validation = fileUploadSchema.safeParse({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.success) {
        const firstError = Object.values(z.flattenError(validation.error).fieldErrors)[0]?.[0];
        setError(firstError || 'Invalid file');
        return;
      }

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${getApiBaseUrl()}/projects/upload`, {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type; browser handles multipart
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Upload failed');
        return;
      }

      // Success - file is uploaded and server-validated
    } catch {
      setError('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="file">Upload File</label>
        <input
          id="file"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          className="w-full"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {isUploading && <p className="text-sm text-primary">Uploading...</p>}
      </div>
    </div>
  );
}
```

**4. API Client with Response Validation**

`id` arrives from `useParams` — it is user input, so it is validated before it is used and encoded before it is interpolated into a path. Validation rejects the wrong *kind* of value; `encodeURIComponent` stops a `/` or `?` in the value from rewriting the URL.

```ts
// src/lib/clients/api-client.ts
import { getApiBaseUrl } from '@/lib/constants';
import { APIError, logError } from '@/lib/errors';
import { z } from 'zod';

const projectIdSchema = z.uuid();

const projectSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.iso.datetime(),
});

type Project = z.infer<typeof projectSchema>;

export async function fetchProject(id: string): Promise<Project> {
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) {
    throw new APIError({ statusCode: 400, data: { message: 'Invalid project id.' } });
  }

  // getApiBaseUrl() is called here, not at module scope — a module-scope throw would
  // abort bundle evaluation before createRoot() runs and render a blank page.
  const response = await fetch(`${getApiBaseUrl()}/projects/${encodeURIComponent(parsedId.data)}`);

  if (!response.ok) {
    throw new APIError({ statusCode: response.status, data: await response.json().catch(() => ({ message: 'Failed to fetch project' })) });
  }

  const data: unknown = await response.json();

  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    // APIError, never a generic Error — the app's error handling is keyed on it.
    // Field detail goes to the log; the thrown message stays user-safe.
    logError(
      'fetchProject: response failed schema validation',
      new Error(JSON.stringify(z.flattenError(parsed.error).fieldErrors))
    );
    throw new APIError({
      statusCode: 502,
      data: { message: 'Received an unexpected response from the server.' },
    });
  }

  return parsed.data;
}
```

## Rules

- Schemas live in `schemas/` — NEVER define or export a schema from a component file
- NEVER hardcode `/api/...` paths — build every URL from `getApiBaseUrl()`, called inside the request function
- Always validate route params / query values with Zod before use, and `encodeURIComponent` any value interpolated into a path
- Throw `APIError`, never a generic `Error` — and never embed validation field detail in the thrown message
- NEVER render a backend error string to the user — log it, show a fixed generic message

## Testing / Verification

```bash
pnpm dev

# Test form validation (client shows error)
# Submit invalid form, verify errors appear

# Test API response validation (if API changes, error caught)
pnpm test
```

## See Also

- `templatecentral:add` (error-handling) — Transform validation errors to consistent response format
- `templatecentral:add` (logging) — Log validation failures with context
- Stack-specific `code-standards` — Type annotation and schema standards
- `templatecentral:add (endpoint)` / `templatecentral:add (form)` — Use validation patterns in new routes/forms

## Validate

Run the stack's build and test commands (see `AGENTS.md` → Scaffold verification).

## After Writing Code

Dispatch in order:
1. the build utility — load it with: `cat "<skill-dir>/../build/SKILL.md"` — validate compilation
2. the review utility — load it with: `cat "<skill-dir>/../review/SKILL.md"` — check code standards