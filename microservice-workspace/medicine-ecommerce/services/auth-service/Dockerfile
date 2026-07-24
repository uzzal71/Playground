FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY tsconfig.json nest-cli.json ./
COPY src ./src

RUN yarn build && yarn install --frozen-lockfile --production --ignore-scripts && yarn cache clean


FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache curl tini && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

RUN mkdir -p /app/keys && chown nestjs:nodejs /app/keys

USER nestjs

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
