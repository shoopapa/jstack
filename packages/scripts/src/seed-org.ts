// Fill an existing org with members and example content. Idempotent for users
// and memberships; posts are only added when the org has none.
//   pnpm --filter @jstack/scripts seed:org -- --slug demo
import { binary, command, option, run, string } from "cmd-ts";

import { db } from "@jstack/db";

import { argv, DEFAULT_PASSWORD, ensureMember, ensureUser } from "./lib";

const PEOPLE = [
  { name: "Olivia Owner", role: "owner" },
  { name: "Adam Admin", role: "admin" },
  { name: "Mia Member", role: "member" },
  { name: "Max Member", role: "member" },
] as const;

const POSTS = [
  { title: "Welcome to the demo org", body: "Seeded by seed:org." },
  { title: "Second post", body: "Edit packages/scripts/src/seed-org.ts." },
  { title: "Tenant scoping", body: "Other orgs cannot see this post." },
];

const cmd = command({
  name: "seed-org",
  args: {
    slug: option({ long: "slug", short: "s", type: string }),
  },
  handler: async ({ slug }) => {
    const org = await db
      .selectFrom("organization")
      .select(["id", "slug"])
      .where("slug", "=", slug)
      .executeTakeFirst();
    if (!org) {
      throw new Error(
        `Org "${slug}" not found — run \`pnpm create:org -- --slug ${slug}\` first`,
      );
    }
    console.log(`Seeding org ${org.slug}…`);

    const userIds: string[] = [];
    for (const p of PEOPLE) {
      const local = p.name.toLowerCase().replace(/\s+/g, ".");
      const userId = await ensureUser({
        email: `${local}+${slug}@example.com`,
        name: p.name,
      });
      await ensureMember(org.id, userId, p.role);
      userIds.push(userId);
    }

    const { count } = await db
      .selectFrom("post")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .where("organizationId", "=", org.id)
      .executeTakeFirstOrThrow();
    if (Number(count) === 0) {
      await db
        .insertInto("post")
        .values(
          POSTS.map((post, i) => ({
            ...post,
            organizationId: org.id,
            authorId: userIds[i % userIds.length] ?? null,
          })),
        )
        .execute();
      console.log(`  + ${POSTS.length} posts`);
    }

    console.log(`\nDone. Members sign in with password "${DEFAULT_PASSWORD}".`);
    await db.destroy();
  },
});

await run(binary(cmd), argv());
