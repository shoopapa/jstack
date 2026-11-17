# jstack

A full-stack TypeScript monorepo starter: Next.js App Router + tRPC + better-auth (orgs/roles) + Postgres via Kysely, with seed scripts, integration tests, and e2e wired up.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo, Node ≥24, TypeScript 7 (versions pinned in the pnpm catalog)
- **App:** Next.js 16 (App Router, RSC) + React 19, Tailwind 4, shadcn/Radix components in `@jstack/ui`
- **API:** tRPC 11 + TanStack Query + superjson, Zod 4 validation
- **Auth:** better-auth — email/password, `organization` plugin (multi-tenant orgs, owner/admin/member roles), `admin` plugin (platform staff)
- **DB:** Postgres + Kysely (no ORM), TS migrations, `kysely-codegen` types
- **Tooling:** oxlint (type-aware), Prettier, Vitest (integration tests against a real DB), Playwright, pino structured logging
- **Local:** Docker — `jstack-db` (Postgres :5300), `jstack-test-db` (:25300, tmpfs)

## Quick start

```bash
pnpm install
cp .env.example .env               # set AUTH_SECRET (openssl rand -base64 32)
pnpm --filter @jstack/db nuke      # docker up → migrate → codegen → seed
pnpm dev                           # http://localhost:3000
```

Sign in as `admin@example.com` / `password`.

## Layout

| Path                  | Role                                                       |
| --------------------- | ---------------------------------------------------------- |
| `apps/nextjs`         | the app (routes, tRPC + auth handlers, RSC data prefetch)  |
| `apps/e2e`            | Playwright suite (runs the standalone production build)    |
| `packages/api`        | tRPC routers, context, procedures; Vitest integration tests |
| `packages/auth`       | better-auth config + access control (roles/permissions)    |
| `packages/db`         | Kysely client, migrations, generated types, reset scripts  |
| `packages/ui`         | shared shadcn components + theme                           |
| `packages/validators` | Zod schemas shared by API input and UI forms               |
| `packages/logger`     | pino JSON logger (`logger.info(msg, fields)`)              |
| `packages/scripts`    | seed CLIs                                                  |
| `tooling/*`           | shared tsconfig, oxlint, prettier, tailwind, CI setup      |

## How a request flows

Browser → `/api/trpc` → `createTRPCContext` (better-auth session) → procedure → `ctx.db` (Kysely) → Postgres.
RSC pages call the same routers in-process via `trpc` from `~/trpc/server` and hydrate the client cache.

Procedures (`packages/api/src/trpc.ts`):

- `publicProcedure` — no session needed
- `protectedProcedure` — signed in (`ctx.user`)
- `orgProcedure` — signed in **and** a member of the active org; adds `ctx.organizationId`, `ctx.role`, and `ctx.can({ post: ["create"] })`

Tenant rows carry `organizationId`; always filter on `ctx.organizationId`, never on an id from the client.

## Seeding

All reset scripts wipe the dev container, start it, run migrations, and regenerate `src/types.ts` first:

| Command                                  | Result                                         |
| ---------------------------------------- | ---------------------------------------------- |
| `pnpm --filter @jstack/db nuke:empty`    | schema only                                    |
| `pnpm --filter @jstack/db nuke:root`     | + root org + internal users                    |
| `pnpm --filter @jstack/db nuke [--slug]` | + demo org (default `demo`) with members/posts |

`nuke` runs `seed:root` → `create:org` → `seed:org`. Every seed step is find-or-create, so re-running is safe. Default password: `password`.

Individual scripts (`pnpm --filter @jstack/scripts <cmd>`):

- `seed:root` — root org + `INTERNAL_USERS` (platform admins, org owners)
- `create:org -- --slug x [--name "X Co"]` — org shell; internal users become owners
- `seed:org -- --slug x` — owner/admin/member users + example posts

## Database

```bash
pnpm --filter @jstack/db migrate:latest   # also: up | down | bottom
pnpm --filter @jstack/db codegen          # regenerate src/types.ts from the live schema
pnpm --filter @jstack/db local:up         # local:down | local:wipe
```

New migration: add `packages/db/migrations/<ISO-timestamp>-<name>.ts` exporting `up`/`down`, run `migrate:latest`, then `codegen`.

## Testing

```bash
pnpm test:setup     # start the test DB + migrate (tmpfs; `pnpm test:down` discards it)
pnpm test           # Vitest integration tests (packages/api/test)
pnpm test:e2e       # build + Playwright
```

## Everyday

```bash
pnpm dev | build | typecheck | lint | format:fix | test | check
```

## CI

`.github/workflows/ci.yml` runs lint, format, typecheck, integration tests (Postgres service), and e2e on every PR and push to `main`.

## Notes

- TypeScript 7 has no JS Compiler API; `experimental.useTypeScriptCli` in `next.config.js` is load-bearing.
- `process.env` is lint-banned outside `env.ts` files — use the validated `env` from `@t3-oss/env-nextjs`.
- Enabling another better-auth plugin usually needs new columns: add a migration, then `codegen`.
