import { initAuth } from "@jstack/auth";
import { db } from "@jstack/db";

/**
 * Shared helpers for seed scripts. Every helper is find-or-create, so any
 * script can be re-run against an existing database.
 */

// Seed scripts never serve HTTP; better-auth only needs a base URL to exist.
export const auth = initAuth({ baseUrl: "http://localhost:3000" });

export const DEFAULT_PASSWORD = "password";

/** Org slug for the platform's own staff org. */
export const ROOT_SLUG = "root";

/** Platform staff — platform `admin`, `owner` of root and every seeded org. */
export const INTERNAL_USERS = [
  { email: "admin@example.com", name: "Admin" },
] as const;

export async function ensureUser(opts: {
  email: string;
  name: string;
  password?: string;
  role?: "admin" | "user";
}) {
  const email = opts.email.toLowerCase();
  const existing = await db
    .selectFrom("user")
    .select("id")
    .where("email", "=", email)
    .executeTakeFirst();
  if (existing) return existing.id;

  const { user } = await auth.api.createUser({
    body: {
      email,
      name: opts.name,
      password: opts.password ?? DEFAULT_PASSWORD,
      role: opts.role ?? "user",
    },
  });
  console.log(`  + user ${email}`);
  return user.id;
}

export async function ensureOrg(opts: { slug: string; name: string }) {
  const existing = await db
    .selectFrom("organization")
    .select(["id", "name", "slug"])
    .where("slug", "=", opts.slug)
    .executeTakeFirst();
  if (existing) return existing;

  const org = await db
    .insertInto("organization")
    .values({ name: opts.name, slug: opts.slug, createdAt: new Date() })
    .returning(["id", "name", "slug"])
    .executeTakeFirstOrThrow();
  console.log(`  + org ${org.slug}`);
  return org;
}

export async function ensureMember(
  organizationId: string,
  userId: string,
  role: "owner" | "admin" | "member",
) {
  const existing = await db
    .selectFrom("member")
    .select("id")
    .where("organizationId", "=", organizationId)
    .where("userId", "=", userId)
    .executeTakeFirst();
  if (existing) return;
  await db
    .insertInto("member")
    .values({ organizationId, userId, role, createdAt: new Date() })
    .execute();
}

/** Strip the `--` pnpm forwards so cmd-ts sees only real args. */
export const argv = () => process.argv.filter((a) => a !== "--");
