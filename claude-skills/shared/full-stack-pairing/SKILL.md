---
name: full-stack-pairing
description: Use when connecting a frontend (Next.js or Vite + React) to a backend (FastAPI or NestJS) — covers proxy config, CORS, environment variables, and cookie forwarding.
---

# Full-Stack Pairing Guide

Cross-stack guidance for connecting a templateCentral frontend to a templateCentral backend.

## Supported Pairings

| Frontend | Backend | Proxy Method |
|----------|---------|-------------|
| Vite + React | FastAPI | Vite `server.proxy` |
| Vite + React | NestJS | Vite `server.proxy` |
| Next.js | FastAPI | Next.js `rewrites` in `next.config.ts` |
| Next.js | NestJS | Next.js `rewrites` in `next.config.ts` |

## Steps

### 1. Set Up the Backend CORS

#### FastAPI (`src/app.py`)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### NestJS (`src/config/setups/security.setup.ts`)

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

### 2. Configure Frontend Proxy (Development)

#### Vite + React (`vite.config.ts`)

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // FastAPI or NestJS
        changeOrigin: true,
      },
    },
  },
});
```

#### Next.js (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};
```

### 3. Environment Variables

#### Frontend `.env`

```env
# Vite + React
VITE_API_BASE_URL=/api

# Next.js
NEXT_PUBLIC_API_BASE_URL=/api/external
API_BASE_URL=http://localhost:8000  # server-side calls
```

#### Backend `.env`

```env
FRONTEND_URL=http://localhost:3000
```

### 4. Frontend HTTP Client

Both templates have a base HTTP client. Configure it with the API base URL:

#### Vite + React (`src/lib/clients/fetch-client.ts`)

```typescript
const client = new FetchClient(import.meta.env.VITE_API_BASE_URL);
```

#### Next.js (`src/integrations/clients/base/axios-client.ts`)

```typescript
const client = new AxiosClient(process.env.API_BASE_URL || '/api/external');
```

### 5. Cookie Forwarding (Auth)

If using cookie-based auth (e.g., session tokens), ensure:

- Backend sets `SameSite=Lax` (or `None` + `Secure` for cross-origin)
- Frontend proxy preserves cookies (both Vite proxy and Next.js rewrites do this by default)
- `credentials: 'include'` on fetch calls, or `withCredentials: true` on Axios

### 6. Production Deployment

In production, you typically:
- Deploy frontend and backend separately
- Use a reverse proxy (Nginx, Caddy) or API gateway to route `/api` to the backend
- Set absolute URLs in environment variables instead of relying on dev proxy

## Rules

- Dev proxies (`server.proxy`, `rewrites`) are for development only — do not rely on them in production.
- Always set `allow_credentials=True` / `credentials: true` in CORS if using cookies.
- Keep API base URLs in environment variables — never hardcode.
- The frontend should never call the backend directly by hostname in client-side code — always go through the proxy path (e.g., `/api`).
- For Next.js server components / route handlers, you can call the backend directly using `API_BASE_URL` (server-side env var).
