# Runs the standalone output of `pnpm turbo run build --filter=@jstack/nextjs`.
# Build on the host/CI first, then `docker build apps/nextjs`.
FROM node:24.22.1-alpine

WORKDIR /app

COPY ./public ./apps/nextjs/public
COPY ./.next/standalone ./
COPY ./.next/static ./apps/nextjs/.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/nextjs/server.js"]
