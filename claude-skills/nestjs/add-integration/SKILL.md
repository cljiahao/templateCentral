---
name: add-integration
description: Use when connecting to an external API (e.g., GitHub, Stripe, OpenAI) from a NestJS project and need an HTTP client module, Zod schemas, and injectable service.
---

# Add an External Integration to NestJS

Create a new third-party API integration in a NestJS project scaffolded from templateCentral.

## Inputs

- **Service name** — The external service (e.g., `github`, `stripe`, `openai`)
- **Base URL** — The API base URL

## Architecture

```
Config → HttpModule → Zod schemas → Injectable service → Module export
```

## Dependencies

```bash
pnpm add @nestjs/axios axios
```

## Steps

### 1. Create Integration Module Directory

Create `src/modules/<name>-integration/` with:
- `<name>-integration.module.ts`
- `<name>-integration.service.ts`
- `<name>-integration.schemas.ts`

### 2. Define Zod Schemas

**`src/modules/<name>-integration/<name>-integration.schemas.ts`**:

```typescript
import { z } from 'zod';

export const githubRepoSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string().url(),
  stargazers_count: z.number().default(0),
});

export type GithubRepo = z.infer<typeof githubRepoSchema>;
```

### 3. Create the Service

**`src/modules/<name>-integration/<name>-integration.service.ts`**:

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { githubRepoSchema, type GithubRepo } from './github-integration.schemas';

@Injectable()
export class GithubIntegrationService {
  constructor(private readonly http: HttpService) {}

  async listRepos(): Promise<GithubRepo[]> {
    const { data } = await firstValueFrom(
      this.http.get('/user/repos'),
    );
    return data.map((r: unknown) => githubRepoSchema.parse(r));
  }

  async getRepo(owner: string, repo: string): Promise<GithubRepo> {
    const { data } = await firstValueFrom(
      this.http.get(`/repos/${owner}/${repo}`),
    );
    return githubRepoSchema.parse(data);
  }
}
```

### 4. Create the Module

**`src/modules/<name>-integration/<name>-integration.module.ts`**:

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { GithubIntegrationService } from './github-integration.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      timeout: 30000,
    }),
  ],
  providers: [GithubIntegrationService],
  exports: [GithubIntegrationService],
})
export class GithubIntegrationModule {}
```

### 5. Register in AppModule or Feature Module

```typescript
import { GithubIntegrationModule } from './modules/github-integration/github-integration.module';

@Module({
  imports: [
    GithubIntegrationModule,
    // ...
  ],
})
export class AppModule {}
```

### 6. Use in Other Services

Inject the integration service wherever needed:

```typescript
import { Injectable } from '@nestjs/common';
import { GithubIntegrationService } from '../github-integration/github-integration.service';

@Injectable()
export class ProjectService {
  constructor(private readonly github: GithubIntegrationService) {}

  async syncRepos() {
    const repos = await this.github.listRepos();
    // Process repos...
  }
}
```

## Rules

- Use `@nestjs/axios` + `HttpModule` — not raw `axios` or `fetch`.
- Validate all external responses with Zod schemas before returning to callers.
- Configure `HttpModule.register()` with `baseURL`, auth headers, and timeout.
- Export the service from the integration module so other modules can import it.
- Keep API tokens in environment variables — never hardcode.
- Integration modules are self-contained — each has its own module, service, and schemas.
- Add `@ApiTags()` and `@ApiOperation()` if the integration exposes its own controller endpoints.
