import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc as defaultAdminAc,
  defaultStatements as defaultAdminStatements,
} from "better-auth/plugins/admin/access";
import {
  defaultStatements as defaultOrgStatements,
  adminAc as orgAdminAc,
  memberAc as orgMemberAc,
  ownerAc as orgOwnerAc,
} from "better-auth/plugins/organization/access";

/**
 * Platform-level roles (`user.role`), checked by the better-auth admin plugin.
 * `admin` is staff on the platform itself — not an org admin.
 */
export const adminAc = createAccessControl(defaultAdminStatements);

export const adminRoles = {
  admin: adminAc.newRole(defaultAdminAc.statements),
  user: adminAc.newRole({}),
} as const;

/**
 * Organization roles (`member.role`). Add your own resources next to the
 * better-auth defaults and grant them per role; tRPC procedures check them with
 * `ctx.can({ post: ["create"] })`.
 */
export const organizationAc = createAccessControl({
  ...defaultOrgStatements,
  post: ["create", "read", "update", "delete"],
});

export const organizationRoles = {
  owner: organizationAc.newRole({
    ...orgOwnerAc.statements,
    post: ["create", "read", "update", "delete"],
  }),
  admin: organizationAc.newRole({
    ...orgAdminAc.statements,
    post: ["create", "read", "update", "delete"],
  }),
  member: organizationAc.newRole({
    ...orgMemberAc.statements,
    post: ["create", "read"],
  }),
} as const;

export type OrganizationRole = keyof typeof organizationRoles;
