FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/domain/package.json ./packages/domain/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --filter @mcpforge/web...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @mcpforge/domain build
RUN pnpm --filter @mcpforge/ui build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @mcpforge/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 4301
ENV PORT=4301
CMD ["node", "apps/web/server.js"]
