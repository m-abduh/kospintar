FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/scheduler/package.json ./packages/scheduler/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/scheduler/node_modules ./packages/scheduler/node_modules
COPY . .
RUN cd packages/shared && pnpm build
RUN cd packages/scheduler && pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/scheduler/dist ./dist
COPY --from=builder /app/packages/scheduler/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./shared/dist
COPY --from=builder /app/packages/shared/node_modules ./shared/node_modules
CMD ["node", "dist/index.js"]
