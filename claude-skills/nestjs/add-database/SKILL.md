---
name: add-database
description: Use when the user wants to add a database, set up Prisma ORM, run migrations, or create database models in a NestJS project.
---

# Add Database to NestJS

Add Prisma ORM to a NestJS project scaffolded from templateCentral.

> **Opt-in only**: Do not add database support unless the user explicitly requests it. The existing `src/database/` directory is a placeholder — it does not contain a working database connection.

## Dependencies

```bash
pnpm add @prisma/client
pnpm add -D prisma
```

## Steps

### 1. Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` — schema definition
- `.env` — with a `DATABASE_URL` placeholder

### 2. Create PrismaService

**`src/database/prisma.service.ts`**:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 3. Create DatabaseModule

**`src/database/database.module.ts`**:

```typescript
import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

### 4. Register in AppModule

Import `DatabaseModule` in `src/app.module.ts`:

```typescript
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    // ...existing modules
  ],
})
export class AppModule {}
```

### 5. Define Schema

Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // or "sqlite", "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 6. Generate Client & Migrate

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 7. Use in Services

Inject `PrismaService` in any module's service:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; name: string }) {
    return this.prisma.user.create({ data });
  }
}
```

## Rules

- **Opt-in only** — the base template has no real database connection. Only add when explicitly requested.
- `DatabaseModule` must be `@Global()` so `PrismaService` is available everywhere without re-importing.
- Place `PrismaService` and `DatabaseModule` in `src/database/`.
- Always use `prisma migrate dev` for schema changes during development.
- Run `prisma generate` after every schema change to update the TypeScript client.
- Keep `DATABASE_URL` in `.env` — never hardcode production credentials.
- For repositories, create a `<feature>.repository.ts` in the feature module that injects `PrismaService`.
