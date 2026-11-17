import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createPostSchema } from "@jstack/validators";

import { orgProcedure } from "../trpc";

/**
 * Example tenant-scoped resource. Every query filters on
 * `ctx.organizationId`; never trust an org id from the client.
 */
export const postRouter = {
  list: orgProcedure.query(({ ctx }) => {
    ctx.can({ post: ["read"] });
    return ctx.db
      .selectFrom("post")
      .leftJoin("user", "user.id", "post.authorId")
      .where("post.organizationId", "=", ctx.organizationId)
      .select([
        "post.id",
        "post.title",
        "post.body",
        "post.createdAt",
        "user.name as authorName",
      ])
      .orderBy("post.createdAt", "desc")
      .limit(50)
      .execute();
  }),

  byId: orgProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      ctx.can({ post: ["read"] });
      const post = await ctx.db
        .selectFrom("post")
        .selectAll()
        .where("id", "=", input.id)
        .where("organizationId", "=", ctx.organizationId)
        .executeTakeFirst();
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  create: orgProcedure.input(createPostSchema).mutation(({ ctx, input }) => {
    ctx.can({ post: ["create"] });
    return ctx.db
      .insertInto("post")
      .values({
        ...input,
        organizationId: ctx.organizationId,
        authorId: ctx.user.id,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();
  }),

  delete: orgProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      ctx.can({ post: ["delete"] });
      const result = await ctx.db
        .deleteFrom("post")
        .where("id", "=", input.id)
        .where("organizationId", "=", ctx.organizationId)
        .executeTakeFirst();
      if (result.numDeletedRows === 0n) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),
} satisfies TRPCRouterRecord;
