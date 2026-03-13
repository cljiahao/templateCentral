---
name: code-standards
description: Use when writing or reviewing TypeScript code in a NestJS project — covers naming, decorators, module structure, Zod DTOs, and dependency rules.
---

# NestJS / TypeScript Code Standards

Coding standards for NestJS projects scaffolded from templateCentral.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | `PascalCase` | `ExampleService` |
| Interfaces | `PascalCase` | `ExampleItem` |
| Functions / Methods | `camelCase` | `findById` |
| Variables | `camelCase` | `createdAt` |
| Constants | `UPPER_SNAKE_CASE` | `HTTP_STATUS_MESSAGES` |
| Files | `kebab-case` (dot-separated) | `example.controller.ts` |
| Directories | `kebab-case` | `common/` |
| DTOs | `PascalCase` + `Dto` suffix | `CreateExampleDto` |
| Modules | `PascalCase` + `Module` suffix | `ExampleModule` |
| Controllers | `PascalCase` + `Controller` suffix | `ExampleController` |
| Services | `PascalCase` + `Service` suffix | `ExampleService` |
| Repositories | `PascalCase` + `Repository` suffix | `ExampleRepository` |
| Tests | `<name>.spec.ts` / `<name>.e2e-spec.ts` | `example.controller.spec.ts` |

## Module Structure

Each feature is a self-contained module under `src/modules/<name>/`:

```
<name>/
├── <name>.module.ts       # @Module declaration
├── <name>.controller.ts   # HTTP endpoints (thin)
├── <name>.service.ts      # Business logic
├── <name>.repository.ts   # Data access
├── <name>.dto.ts          # Zod DTOs
├── <name>.types.ts        # TypeScript interfaces
└── services/              # (optional) Sub-services for complex domains
    └── <sub>.ts
```

## Dependency Injection

- Use constructor injection — NestJS resolves dependencies automatically.
- Mark all injectables with `@Injectable()`.
- Export services from modules if they need to be consumed by other modules.
- Use `@Module({ exports: [MyService] })` to make services available.

## DTOs and Validation

- Use `nestjs-zod` with `createZodDto` for all DTOs.
- Define Zod schemas as `const` above the DTO class.
- Use `.partial()` for update DTOs.
- The global `ZodValidationPipe` validates all incoming requests automatically.

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const UpdateItemSchema = CreateItemSchema.partial();

export class CreateItemDto extends createZodDto(CreateItemSchema) {}
export class UpdateItemDto extends createZodDto(UpdateItemSchema) {}
```

## Controllers

- Keep controllers thin — accept request, delegate to service, return response.
- Use `@ApiTags()` and `@ApiOperation()` for Swagger documentation.
- Use `@HttpCode()` when the default status code is not appropriate.
- Use `@Param()`, `@Body()`, `@Query()` for extracting request data.

## Services

- Services contain business logic and orchestrate between repositories.
- One service per module (split into sub-services if complexity warrants).
- Use `crypto.randomUUID()` for generating IDs (Node.js built-in).
- Return typed objects, not raw database results.

## Error Handling

- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, etc.
- Provide descriptive error messages.
- The global `HttpExceptionFilter` catches and formats all HTTP exceptions.
- For domain-specific errors, create custom exceptions extending `HttpException`.

## Imports

- Use relative imports within a module.
- Use path-relative imports from `src/` root for cross-module imports.
- Barrel exports (`index.ts`) at the `modules/` level.
- Order: NestJS/framework → third-party → local (separated by blank lines).

## Swagger

- Every controller gets `@ApiTags()`.
- Every endpoint gets `@ApiOperation({ summary: '...' })`.
- Use `@ApiParam()` and `@ApiBody()` for parameter documentation.
- DTOs from `nestjs-zod` generate Swagger schemas automatically.

## Type Annotations

- Annotate all public method parameters and return types.
- Use `type` imports for interfaces: `import type { ExampleItem } from './example.types'`.
- Prefer interfaces for object shapes, types for unions/aliases.

## Tooling

- **ESLint 9** — flat config with typescript-eslint + prettier.
- **Prettier** — single quotes, trailing commas.
- **Jest** — testing framework with ts-jest.
- **Fastify `app.inject()`** — HTTP assertions for e2e tests (NEVER use Supertest with Fastify).

## Rules

- **kebab-case** (dot-separated) filenames, **PascalCase** classes, **camelCase** methods
- Named exports only — NEVER use `export default`
- **`nestjs-zod`** with `createZodDto` for all DTOs — NEVER use `class-validator` or `class-transformer`
- **One module per feature** — self-contained with controller, service, repository
- Controllers are thin — delegate to services; NEVER put business logic in controllers
- Swagger documentation on every endpoint — `@ApiTags()` + `@ApiOperation()`; NEVER skip `@ApiOperation()`
- NEVER import controllers from services — dependency flows one way only
- NEVER use `any` without justification — prefer `unknown` and narrow with type guards
- NEVER create circular module dependencies — use `forwardRef()` only as a last resort
- NEVER put database queries in services — use a repository layer
