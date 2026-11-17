// Root org + internal users. Idempotent.
//   pnpm --filter @jstack/scripts seed:root
import { db } from "@jstack/db";

import {
  DEFAULT_PASSWORD,
  ensureMember,
  ensureOrg,
  ensureUser,
  INTERNAL_USERS,
  ROOT_SLUG,
} from "./lib";

console.log("Seeding root org…");
const root = await ensureOrg({ slug: ROOT_SLUG, name: "Root" });

for (const u of INTERNAL_USERS) {
  const userId = await ensureUser({ ...u, role: "admin" });
  await ensureMember(root.id, userId, "owner");
}

console.log(
  `\nDone. Sign in at http://localhost:3000/sign-in as ${INTERNAL_USERS[0].email} / ${DEFAULT_PASSWORD}`,
);
await db.destroy();
