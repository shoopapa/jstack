# Repository Guidance

Canonical instructions for coding agents. `CLAUDE.md` points here.

## Layout

- `apps/nextjs`: Next.js app
- `apps/e2e`: Playwright tests
- `packages/api`: tRPC routers and context
- `packages/auth`: better-auth config and permissions
- `packages/db`: Kysely client, migrations, generated types
- `packages/ui`: shared UI components
- `packages/validators`: shared Zod schemas
- `packages/scripts`: seed CLIs

Prefer shared packages over duplicating logic in an app. Use the pnpm catalog for
dependencies when a version already exists there.

## Architecture

- Next.js App Router. Routes live in `apps/nextjs/src/app/<route>/page.tsx`;
  colocate route-specific components.
- Prefer React Server Components. Add `"use client"` only for state, hooks,
  event handlers, or browser APIs.
- `~/` for app-local imports, `@jstack/*` for workspace packages.
- tRPC for app data: routers in `packages/api/src/router/`, Zod inputs,
  registered in `packages/api/src/root.ts`.
- `publicProcedure` (no session), `protectedProcedure` (session),
  `orgProcedure` (session + active org membership; use `ctx.can(...)` for
  permissions and filter tenant data on `ctx.organizationId`).
- Database access only through `ctx.db` in procedures. Never create another client.
- Gate UI on the server with `getSession()` from `~/auth/server`. Never log or
  commit secrets.
- Reuse `@jstack/ui` components before adding app-local ones.

## Database

- Dev: container `jstack-db`, host port `5300`, database `postgres`.
- Test: container `jstack-test-db`, host port `25300`, database `jstack_test`.

Only connect to these. Never point tests at the dev database. Table and column
names are camelCase and must be double-quoted in raw SQL; prefer Kysely.

- Reset dev: `pnpm --filter @jstack/db nuke` (or `nuke:root` / `nuke:empty`).
- Reset test: `pnpm test:down && pnpm test:setup`.
- After adding a migration: `migrate:latest`, then `codegen`.

## Commands

Run from the repo root:

```bash
pnpm dev
pnpm build
pnpm format:fix
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

Before finishing a change, run the checks that match its scope.
