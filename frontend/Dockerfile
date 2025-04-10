# Base image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Stage 1
FROM base AS build
# Install dependencies
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile
# Build app
COPY . .
RUN bun run build

# Stage 2
FROM base AS release
# Copy artifacts
WORKDIR /app
COPY --from=build /usr/src/app/.output .
# Run app with bun
USER bun
EXPOSE 3000/tcp
ENV NUXT_HOST=0.0.0.0
ENTRYPOINT ["bun", "run", "./server/index.mjs", "--host", "$NUXT_HOST"]
