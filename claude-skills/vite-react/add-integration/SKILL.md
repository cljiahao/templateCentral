---
name: add-integration
description: Use when connecting to an external API (e.g., GitHub, Stripe, OpenAI) from a Vite + React SPA and need a typed client, Zod response schemas, and service layer.
---

# Add an External Integration

Create a new third-party API integration in a Vite + React project scaffolded from templateCentral.

## Inputs

- **Service name** — The external service (e.g., `github`, `stripe`, `weather`)
- **Base URL** — The API base URL

## Architecture

```
ENV → services/ → clients/ → schemas/
```

- **clients/** — Thin HTTP clients that extend `FetchClient` from `src/lib/clients/`
- **schemas/** — Zod schemas for validating external responses
- **services/** — Business logic wrapping the client

Create `src/integrations/` on first integration — this directory does not exist in the base template. The base `FetchClient` lives in `src/lib/clients/fetch-client.ts`.

## Steps

### 1. Create the Client

Extend the base `FetchClient` (at `src/lib/clients/fetch-client.ts`) which handles response parsing, error mapping, and content-type negotiation:

```ts
// src/integrations/clients/github-client.ts
import { FetchClient } from '@/lib/clients/fetch-client';
import type { GithubRepo } from '../schemas/github-schemas';

export class GithubClient extends FetchClient {
  constructor(baseUrl: string, headers: Record<string, string>) {
    super(baseUrl, headers);
  }

  async getRepos() {
    return this.request<GithubRepo[]>('user/repos');
  }

  async getRepo(owner: string, repo: string) {
    return this.request<GithubRepo>(`repos/${owner}/${repo}`);
  }
}
```

> **Why extend FetchClient**: It handles JSON/binary/text content-type parsing, maps HTTP errors to `APIError` with status codes and response data, and provides typed `request<T>()`. You focus only on endpoint paths and types.

### 2. Create Zod Schemas

```ts
// src/integrations/schemas/github-schemas.ts
import { z } from 'zod';

export const githubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
});

export type GithubRepo = z.infer<typeof githubRepoSchema>;
```

### 3. Create the Service

```ts
// src/integrations/services/github-service.ts
import type { GithubClient } from '../clients/github-client';
import { githubRepoSchema, type GithubRepo } from '../schemas/github-schemas';

export class GithubService {
  constructor(private readonly client: GithubClient) {}

  async getRepos(): Promise<GithubRepo[]> {
    const data = await this.client.getRepos();
    return githubRepoSchema.array().parse(data);
  }
}
```

### 4. Create a Configured Instance

Since Vite uses `import.meta.env`, create the instance at the integrations root:

```ts
// src/integrations/github.ts
import { ENV } from '@/lib/constants/env';
import { GithubClient } from './clients/github-client';
import { GithubService } from './services/github-service';

const client = new GithubClient(
  ENV.GITHUB_API_URL ?? 'https://api.github.com',
  {
    Authorization: `Bearer ${ENV.GITHUB_TOKEN ?? ''}`,
    Accept: 'application/json',
  },
);

export const Github = new GithubService(client);
```

> **Naming convention**: Exported instances use PascalCase matching the integration name: `Github`, `Stripe`, `Analytics`. This keeps imports consistent across the codebase.

Add the env vars to `src/lib/constants/env.ts`:

```ts
export const ENV = {
  // ... existing
  GITHUB_API_URL: import.meta.env.VITE_GITHUB_API_URL as string | undefined,
  GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN as string | undefined,
} as const;
```

### 5. Consume via React Query Hook

Create the consumer feature first using the `add-feature` skill (e.g., `repos`), then add the hook inside it:

```ts
// src/features/repos/hooks/use-repos.query.ts
import { useQuery } from '@tanstack/react-query';
import { Github } from '@/integrations/github';

export const useRepos = () => {
  return useQuery({
    queryKey: ['github', 'repos'],
    queryFn: () => Github.getRepos(),
  });
};
```

Export from the feature's barrel (`hooks/index.ts` → `index.ts`) so consumers import via `@/features/repos`.

### 6. Validate

```bash
pnpm build && pnpm test
```

Confirm the build succeeds with no type errors and all tests pass. Verify the integration works end-to-end in the browser.

## Rules

- Clients are thin — they only make HTTP requests; NEVER put business logic in clients
- Schemas validate external responses with Zod — external data is untrusted; NEVER skip Zod validation on external API responses
- Services contain business logic and call clients
- Environment variables use `import.meta.env.VITE_*` (NEVER `process.env`), centralized in `src/lib/constants/env.ts`; NEVER hardcode API URLs or secrets
- Always throw `APIError` for HTTP failures — NEVER throw generic `Error`
- NEVER consume integrations directly in components — go through React Query hooks in features
