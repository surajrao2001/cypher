FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/api/package.json apps/api/package.json
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile --filter @cypher/api...

FROM base AS build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm --filter @cypher/api... build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
