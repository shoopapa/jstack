import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Example domain table. Every tenant-owned row carries `organizationId`, and
 * every query that reads it filters on the caller's active organization — see
 * `orgProcedure` in packages/api/src/trpc.ts.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("post")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("organizationId", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("authorId", "text", (col) =>
      col.references("user.id").onDelete("set null"),
    )
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("body", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("post_organization_created_idx")
    .on("post")
    .columns(["organizationId", "createdAt"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("post").ifExists().execute();
}
