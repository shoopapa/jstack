// Create an org shell and add every internal user as owner. Idempotent.
//   pnpm --filter @jstack/scripts create:org -- --slug demo [--name "Demo Co"]
import { binary, command, option, optional, run, string } from "cmd-ts";

import { db } from "@jstack/db";

import { argv, ensureMember, ensureOrg, INTERNAL_USERS } from "./lib";

const cmd = command({
  name: "create-org",
  args: {
    slug: option({ long: "slug", short: "s", type: string }),
    name: option({ long: "name", short: "n", type: optional(string) }),
  },
  handler: async ({ slug, name }) => {
    const org = await ensureOrg({
      slug,
      name: name ?? slug.charAt(0).toUpperCase() + slug.slice(1),
    });
    const internal = await db
      .selectFrom("user")
      .select("id")
      .where(
        "email",
        "in",
        INTERNAL_USERS.map((u) => u.email),
      )
      .execute();
    for (const u of internal) await ensureMember(org.id, u.id, "owner");
    console.log(`Org ${org.slug} ready (${org.id})`);
    await db.destroy();
  },
});

await run(binary(cmd), argv());
