# ─── Stage 1: Builder ────────────────────────────────────────────────────────
# This stage has everything needed to compile TypeScript to JavaScript.
# It will be completely discarded after building — none of these tools
# end up in your production image.
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

# Install pnpm globally — same version strategy as our CI pipeline.
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Silence pnpm update notifications in CI/Docker contexts
ENV NO_UPDATE_NOTIFIER=1
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only the files needed to install dependencies first.
# This is a critical Docker optimization: if package.json and 
# pnpm-lock.yaml haven't changed, Docker reuses the cached 
# node_modules layer and skips the expensive install step entirely.
# Copying source code first would bust this cache on every code change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/task-service/package.json ./apps/task-service/
COPY packages/ ./packages/

# Install ALL dependencies including devDependencies —
# we need the TypeScript compiler and NestJS CLI in this stage.
RUN pnpm install --frozen-lockfile

# Now copy the source code and build.
# This layer changes on every code edit, but that's fine because
# the expensive node_modules layer above is already cached.
COPY apps/task-service/ ./apps/task-service/

RUN pnpm --filter task-service run build

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
# This is the image that actually runs in production.
# It starts completely fresh — no source code, no dev tools,
# no TypeScript compiler. Only what's needed to run the app.
FROM --platform=$BUILDPLATFORM node:22-alpine AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Silence pnpm update notifications in CI/Docker contexts
ENV NO_UPDATE_NOTIFIER=1
RUN corepack enable && corepack prepare pnpm@latest --activate

# Run as a non-root user — a critical security practice.
# Containers run as root by default, which means a compromised
# container has root access to the host. This limits the blast radius.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/task-service/package.json ./apps/task-service/

# Install ONLY production dependencies — no devDependencies.
# This is what makes the final image lean.
RUN pnpm install --frozen-lockfile --prod

# Copy the compiled JavaScript from the builder stage.
# The --from=builder flag is what makes this multi-stage:
# we're reaching back into the discarded builder to grab its output.
COPY --from=builder /app/apps/task-service/dist ./apps/task-service/dist

USER appuser

WORKDIR /app/apps/task-service

# Document which port this service listens on.
# This is metadata only — it doesn't actually publish the port.
# The actual port binding happens in Kubernetes via the Service manifest.
EXPOSE 4001

# Use the compiled JavaScript directly with Node — no ts-node,
# no NestJS CLI, just plain Node running the compiled output.
ENTRYPOINT [ "node" ]
CMD ["dist/main.js"]