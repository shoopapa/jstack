/**
 * tRPC setup: request context, middleware, and the procedure builders every
 * router uses. Routers live in ./router and are registered in ./root.ts.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import type { Auth, Session } from "@jstack/auth";
import type { OrganizationRole } from "@jstack/auth/permissions";
import type { Database } from "@jstack/db";
import type { Logger } from "@jstack/logger";
import { organizationRoles } from "@jstack/auth/permissions";
import { db } from "@jstack/db";
import { logger } from "@jstack/logger";

import { logTrpcError } from "./lib/trpc-errors";

/**
 * 1. CONTEXT — what every procedure can reach. The Next.js route handler, the
 * RSC proxy, and the test harness each build one of these.
 */
export interface Context {
  authApi: Auth["api"];
  session: Session | null;
  db: Database;
  headers: Headers;
  /** Unique id for this request, attached to every structured log it emits. */
  requestId: string;
  /** Request-scoped structured logger (pre-seeded with `requestId`). */
  log: Logger;
}

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Auth;
}): Promise<Context> => {
  const session = await opts.auth.api.getSession({ headers: opts.headers });
  const requestId = crypto.randomUUID();
  return {
    authApi: opts.auth.api,
    session,
    db,
    headers: opts.headers,
    requestId,
    log: logger.child({ requestId }),
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Logs one line per call and, in dev, adds 100-500ms of latency so request
 * waterfalls show up locally the way they will in production.
 */
const timingMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const userId = ctx.session?.user.id;
  const orgId = ctx.session?.session.activeOrganizationId ?? undefined;
  ctx.log.info("trpc.request", {
    path,
    type,
    durationMs: Date.now() - start,
    ok: result.ok,
    ...(userId ? { userId } : {}),
    ...(orgId ? { orgId } : {}),
  });
  // RSC/server-caller failures never reach the HTTP adapter's onError.
  if (!result.ok) logTrpcError(ctx.log, { path, error: result.error });

  return result;
});

/**
 * 3. PROCEDURES
 */

/** No session required. `ctx.session` may still be set. */
export const publicProcedure = t.procedure.use(timingMiddleware);

/** Signed in. `ctx.user` is guaranteed; there may be no active org. */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      log: ctx.log.child({ userId: ctx.session.user.id }),
    },
  });
});

type OrgStatements = Parameters<
  (typeof organizationRoles)[OrganizationRole]["authorize"]
>[0];

/**
 * Signed in AND a member of an active organization. Adds:
 * - `ctx.organizationId` — scope every tenant query with it
 * - `ctx.role` — the caller's role in that org
 * - `ctx.can(statements)` — throws FORBIDDEN unless the role grants them
 */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active organization",
    });
  }
  const member = await ctx.db
    .selectFrom("member")
    .select("role")
    .where("organizationId", "=", organizationId)
    .where("userId", "=", ctx.user.id)
    .executeTakeFirst();
  if (!member || !(member.role in organizationRoles)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not a member of this organization",
    });
  }
  const role = member.role as OrganizationRole;

  const can = (statements: OrgStatements) => {
    const result = organizationRoles[role].authorize(statements);
    if (!result.success) {
      throw new TRPCError({ code: "FORBIDDEN", message: result.error });
    }
  };

  return next({
    ctx: {
      organizationId,
      role,
      can,
      log: ctx.log.child({ orgId: organizationId }),
    },
  });
});
