import { db } from "@jstack/db";

export { db };

/** Create an org and make an existing user its owner. */
export async function createOrgFor(userId: string, name: string) {
  const id = crypto.randomUUID();
  const org = await db
    .insertInto("organization")
    .values({ id, name, slug: `e2e-${id}`, createdAt: new Date() })
    .returning(["id", "name"])
    .executeTakeFirstOrThrow();
  await db
    .insertInto("member")
    .values({
      organizationId: org.id,
      userId,
      role: "owner",
      createdAt: new Date(),
    })
    .execute();
  return org;
}
