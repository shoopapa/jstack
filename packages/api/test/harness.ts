/**
 * Integration-test harness: runs the real `appRouter`, middleware, Zod parsing
 * and SQL against the test Postgres from `.env.test`. Only better-auth's HTTP
 * surface is stubbed — a session object is built directly instead of signing
 * cookies.
 *
 *   const fx = createFixtures();
 *   afterEach(fx.cleanup);
 *   const org = await fx.organization();
 *   const owner = await fx.member(org, "owner");
 *   const caller = createCaller(owner);
 */
import type { Auth, Session } from "@jstack/auth";
import type { OrganizationRole } from "@jstack/auth/permissions";
import { db } from "@jstack/db";
import { logger } from "@jstack/logger";

import { appRouter, createCallerFactory } from "../src";

export { db };

const callerFactory = createCallerFactory(appRouter);

export interface TestActor {
  userId: string;
  email: string;
  name: string;
  organizationId: string | null;
}

export function createCaller(actor: TestActor) {
  const now = new Date();
  const session = {
    session: {
      id: crypto.randomUUID(),
      token: crypto.randomUUID(),
      userId: actor.userId,
      activeOrganizationId: actor.organizationId,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
    user: {
      id: actor.userId,
      email: actor.email,
      name: actor.name,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  } as unknown as Session;

  return callerFactory({
    authApi: {} as Auth["api"],
    session,
    db,
    headers: new Headers(),
    requestId: crypto.randomUUID(),
    log: logger,
  });
}

export function createFixtures() {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  return {
    async organization() {
      const id = crypto.randomUUID();
      const org = await db
        .insertInto("organization")
        .values({
          id,
          name: `Test Org ${id.slice(0, 8)}`,
          slug: `test-${id}`,
          createdAt: new Date(),
        })
        .returning(["id", "name", "slug"])
        .executeTakeFirstOrThrow();
      orgIds.push(org.id);
      return org;
    },

    async member(
      org: { id: string },
      role: OrganizationRole,
    ): Promise<TestActor> {
      const id = crypto.randomUUID();
      const now = new Date();
      const user = await db
        .insertInto("user")
        .values({
          id,
          name: `Test ${role}`,
          email: `${role}-${id}@test.local`,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning(["id", "email", "name"])
        .executeTakeFirstOrThrow();
      userIds.push(user.id);
      await db
        .insertInto("member")
        .values({
          organizationId: org.id,
          userId: user.id,
          role,
          createdAt: now,
        })
        .execute();
      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        organizationId: org.id,
      };
    },

    async cleanup() {
      if (orgIds.length) {
        await db.deleteFrom("organization").where("id", "in", orgIds).execute();
      }
      if (userIds.length) {
        await db.deleteFrom("user").where("id", "in", userIds).execute();
      }
      orgIds.length = 0;
      userIds.length = 0;
    },
  };
}
