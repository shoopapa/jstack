import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";

import { db, dialect } from "@jstack/db";
import { logger } from "@jstack/logger";

import { env } from "./env";
import {
  adminAc,
  adminRoles,
  organizationAc,
  organizationRoles,
} from "./permissions";

export function initAuth(options: {
  baseUrl: string;
  trustedOrigins?: string[];
}) {
  const config = {
    baseURL: options.baseUrl,
    secret: env.AUTH_SECRET,
    trustedOrigins: [options.baseUrl, ...(options.trustedOrigins ?? [])],
    database: { dialect },
    emailAndPassword: { enabled: true },
    session: {
      expiresIn: 14 * 24 * 60 * 60, // 14 days
    },
    databaseHooks: {
      session: {
        create: {
          // Land every new session in the user's most recent org so
          // org-scoped procedures work straight after sign-in.
          before: async (session) => {
            const row = await db
              .selectFrom("member")
              .where("userId", "=", session.userId)
              .select("organizationId")
              .orderBy("createdAt", "desc")
              .executeTakeFirst();
            if (!row) {
              logger.info("auth.session.no_org_membership", {
                userId: session.userId,
              });
              return { data: session };
            }
            return {
              data: { ...session, activeOrganizationId: row.organizationId },
            };
          },
        },
      },
    },
    plugins: [
      admin({ ac: adminAc, roles: adminRoles }),
      organization({
        ac: organizationAc,
        roles: organizationRoles,
        // Only platform admins create orgs; everyone else is added to one.
        allowUserToCreateOrganization: (user) =>
          (user as { role?: string | null }).role === "admin",
      }),
      // Must be last: lets server actions / RSC set auth cookies.
      nextCookies(),
    ],
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>;
