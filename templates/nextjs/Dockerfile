# ---- Global build arguments ----
# NODE:           Base Node.js image (pinned for reproducible builds).
#                 Override with a hardened image via --build-arg NODE=dhi.io/...
# APP_UID/GID:    Non-root user/group IDs for container security
# APP_USERNAME:   Non-root username inside the container
# APP_GROUPNAME:  Non-root group name inside the container
# APP_DIR:        Working directory for all stages
# PORT:           Port the Next.js standalone server listens on
ARG NODE=node:24.14-alpine3.23
ARG APP_UID=1001
ARG APP_GID=1001
ARG APP_USERNAME=container-user
ARG APP_GROUPNAME=container-group
ARG APP_DIR=/app
ARG PORT=3000

# ---- Base ----
# Shared Alpine + Node foundation. All dependency/build stages inherit from here
# so that OS-level packages (tzdata) are only installed once.
# The non-root user is created here so /etc/passwd and /etc/group can be copied
# into prod images that may not have `adduser`/`addgroup` (e.g. hardened images).
FROM ${NODE} AS base
ARG APP_DIR
ARG APP_UID
ARG APP_GID
ARG APP_USERNAME
ARG APP_GROUPNAME

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR ${APP_DIR}

RUN apk add --no-cache tzdata \
    && apk upgrade --no-cache \
    && cp /usr/share/zoneinfo/Asia/Singapore /etc/localtime \
    && echo "Asia/Singapore" > /etc/timezone

RUN addgroup -g ${APP_GID} ${APP_GROUPNAME} && \
    adduser -S -u ${APP_UID} -h ${APP_DIR} -s /sbin/nologin -G ${APP_GROUPNAME} ${APP_USERNAME}

# ---- Prisma (conditional) ----
# Copies prisma/ directory if it exists. When a project doesn't use Prisma,
# the glob matches nothing and produces an empty layer — no build failure.
# This is needed before `npm ci` because Prisma generates its client during postinstall.
FROM scratch AS prisma
COPY prisma* /prisma/

# ---- Dependencies ----
# Installs ALL dependencies (including devDependencies).
# Used by both the builder (needs TypeScript, build tools, etc.) and the dev stage.
# The final prod image does NOT copy node_modules from here — Next.js standalone
# output traces and bundles only the runtime dependencies it actually needs.
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
COPY --from=prisma /prisma* ./prisma/
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---- Builder ----
# Copies source code and runs `next build`. Next.js standalone output mode
# produces a self-contained server.js + .next/static that don't need
# node_modules at runtime, keeping the production image small.
FROM deps AS builder
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY ./ ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---- Development ----
# Full Node environment with all deps + source for local dev (hot reload).
# Uses docker-entrypoint.sh to auto-detect the package manager and run "dev".
FROM deps AS dev
ENV NODE_ENV="development"
COPY ./ ./
RUN apk add --no-cache curl
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["dev"]

# ---- Production ----
# Minimal Node.js image running the Next.js standalone server. Only the build
# output is copied — no source code or node_modules in the final image.
# Requires `output: "standalone"` in next.config.js.
FROM base AS prod
ARG APP_UID
ARG APP_GID
ARG APP_DIR
ARG PORT

ENV NODE_ENV="production" \
    NODE_OPTIONS=--max-old-space-size=384 \
    PORT=${PORT} \
    HOSTNAME="0.0.0.0"

COPY --chown=${APP_UID}:${APP_GID} --from=builder ${APP_DIR}/public ./public
COPY --chown=${APP_UID}:${APP_GID} --from=builder ${APP_DIR}/.next/standalone ./
COPY --chown=${APP_UID}:${APP_GID} --from=builder ${APP_DIR}/.next/static ./.next/static

EXPOSE ${PORT}
USER ${APP_UID}

CMD ["node", "server.js"]
