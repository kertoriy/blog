# syntax=docker/dockerfile:1

# =========================================================
# Stage 1: 使用 Node 22 + pnpm 10 静态预渲染 Nuxt 4 博客
# =========================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG NUXT_APP_BASE_URL=/
ENV NUXT_APP_BASE_URL=${NUXT_APP_BASE_URL}

RUN pnpm generate

# =========================================================
# Stage 2: 极简 Caddy 2 Alpine 镜像托管静态产物（支持自动 HTTPS）
# =========================================================
FROM caddy:2-alpine AS runner

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/.output/public /srv/blog

EXPOSE 80 443 443/udp

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
