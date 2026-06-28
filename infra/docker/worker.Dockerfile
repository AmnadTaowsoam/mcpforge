FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/domain/package.json ./packages/domain/
RUN pnpm install --frozen-lockfile --filter @mcpforge/worker...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @mcpforge/domain build
RUN pnpm --filter @mcpforge/config build
RUN pnpm --filter @mcpforge/worker build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/worker/dist ./dist
COPY --from=build /app/apps/worker/package.json ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
