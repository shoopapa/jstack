import type { TRPCRouterRecord } from "@trpc/server";

import { orgProcedure, protectedProcedure } from "../trpc";

export const organizationRouter = {
  /** Every org the caller belongs to, with their role in each. */
  mine: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .selectFrom("member")
      .innerJoin("organization", "organization.id", "member.organizationId")
      .where("member.userId", "=", ctx.user.id)
      .select([
        "organization.id",
        "organization.name",
        "organization.slug",
        "member.role",
      ])
      .orderBy("organization.name")
      .execute(),
  ),

  /** The active org plus the caller's role in it. */
  current: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db
      .selectFrom("organization")
      .select(["id", "name", "slug"])
      .where("id", "=", ctx.organizationId)
      .executeTakeFirstOrThrow();
    return { ...org, role: ctx.role };
  }),
} satisfies TRPCRouterRecord;
