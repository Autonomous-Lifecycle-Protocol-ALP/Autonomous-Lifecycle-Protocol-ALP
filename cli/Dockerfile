FROM node:24-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json .npmrc ./
COPY parser/package.json parser/
COPY schemas/package.json schemas/
COPY sdk/typescript/package.json sdk/typescript/
COPY mcp-server/package.json mcp-server/
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace @autonomous-lifecycle-protocol-alp/parser --workspace @autonomous-lifecycle-protocol-alp/cli

FROM base AS runner
RUN addgroup --system --gid 1001 alp && \
    adduser --system --uid 1001 alp
USER alp
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/cli/dist ./dist
COPY --from=builder /app/parser/dist ./parser/dist
COPY --from=builder /app/schemas/index.js ./schemas/index.js
ENTRYPOINT ["node", "dist/index.js"]
