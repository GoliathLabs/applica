# Base image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Stage 1
FROM base AS install
# Install dependencies
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile --production

# Stage 2
FROM base AS release
# Copy artifacts
WORKDIR /app
COPY --from=install /usr/src/app/node_modules node_modules
COPY . .
# Run app with bun
USER bun
EXPOSE 8080/tcp
ENTRYPOINT ["bun", "run", "src/index.ts"]
