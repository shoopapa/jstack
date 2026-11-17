import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { initAuth } from "@jstack/auth";

import { getBaseUrl } from "~/get-base-url";

export const auth = initAuth({ baseUrl: getBaseUrl() });

/** Session for the current request, deduped across a single render. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
