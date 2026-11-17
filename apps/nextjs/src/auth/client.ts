import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import {
  adminAc,
  adminRoles,
  organizationAc,
  organizationRoles,
} from "@jstack/auth/permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({ ac: adminAc, roles: adminRoles }),
    organizationClient({ ac: organizationAc, roles: organizationRoles }),
  ],
});
