FROM node:18-alpine AS production

# ── System hardening ─────────────────────────────────────────
# Run as a non-root user to limit container escape risk
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# ── Install production dependencies only ─────────────────────
COPY package*.json ./
RUN npm ci --omit=dev && \
    # Clean npm cache to reduce image size
    npm cache clean --force

# ── Copy application source from builder ─────────────────────
COPY . .

# ── Directory permissions ─────────────────────────────────────
# Give appuser ownership of the working directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# ── Runtime configuration ─────────────────────────────────────
# Document the port (does NOT actually publish it — use -p flag)
EXPOSE 10000

# NODE_ENV defaults to production; override with --env if needed
ENV NODE_ENV=production

# ── Health check ──────────────────────────────────────────────
# Docker (and Railway/Render) will mark the container unhealthy
# if this check fails 3 times in a row.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:1911/ || exit 1

# ── Entrypoint ────────────────────────────────────────────────
# Use the JSON array form (exec form) — avoids spawning a shell,
# so SIGTERM reaches Node.js directly for graceful shutdown.
CMD ["node", "index.js"]