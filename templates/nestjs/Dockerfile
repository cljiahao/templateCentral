ARG NODE=node:24.14-alpine3.23
ARG APP_UID=1001
ARG APP_GID=1001
ARG APP_USERNAME=container-user
ARG APP_GROUPNAME=container-group
ARG HOME=/app
ARG PORT=3000

# ---- Base ----
FROM ${NODE} AS base
ARG APP_UID
ARG APP_GID
ARG APP_USERNAME
ARG APP_GROUPNAME
ARG HOME
ARG PORT

ENV HOME=${HOME} \
    PORT=${PORT}

WORKDIR ${HOME}

RUN apk add --no-cache tzdata curl && \
    rm -rf /var/cache/apk/* && \
    addgroup -g ${APP_GID} ${APP_GROUPNAME} && \
    adduser -S -u ${APP_UID} -h ${HOME} -s /sbin/nologin -G ${APP_GROUPNAME} ${APP_USERNAME} && \
    chown -R ${APP_UID}:${APP_GID} ${HOME} && \
    chmod -R 755 ${HOME} && \
    chmod 1777 /tmp

# ---- Dev Dependencies ----
FROM base AS devdeps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  elif [ -f yarn.lock ]; then yarn; \
  elif [ -f package-lock.json ]; then npm install; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---- Prod Dependencies ----
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---- Builder ----
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
FROM devdeps AS dev
ENV NODE_ENV="development"
COPY ./ ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["dev"]

# ---- Staging ----
FROM builder AS stage
ENV NODE_ENV="staging"
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["start"]

# ---- Production ----
FROM base AS prod
ARG APP_UID
ARG APP_GID
ARG HOME

ENV NODE_ENV="production" \
    NODE_OPTIONS=--max-old-space-size=384

COPY --chown=${APP_UID}:${APP_GID} --from=deps ${HOME}/node_modules ./node_modules
COPY --chown=${APP_UID}:${APP_GID} --from=builder ${HOME}/dist ./dist

EXPOSE ${PORT}
USER ${APP_UID}

CMD ["node", "dist/main.js"]
