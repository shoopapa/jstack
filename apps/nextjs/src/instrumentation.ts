// Next.js instrumentation hook. `onRequestError` is the framework's supported
// entry point for server-side errors thrown during rendering, route handlers,
// and Server Actions — the surfaces that never pass through our tRPC/route
// logging. Funnel those into the structured logger so prod errors land as
// JSON with a stack, not as an unstructured framework dump.
//
// See https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

import type { Instrumentation } from "next";
import { z } from "zod";

import { logger } from "@jstack/logger";

// Read just the message off the `unknown` error rather than hand-rolling typeof
// checks.
const errorMessageSchema = z.object({ message: z.string() });

// A stale browser tab still holding a since-removed Server Action's ID (its
// bundle predates the deploy that deleted the action) POSTs that ID and Next
// throws "Failed to find Server Action …". That's a client-out-of-date
// condition, not a server fault, so it should not trip error-level alerts. See https://nextjs.org/docs/messages/failed-to-find-server-action
const isStaleServerAction = (err: unknown) => {
  const parsed = errorMessageSchema.safeParse(err);
  return (
    parsed.success &&
    parsed.data.message.includes("Failed to find Server Action")
  );
};

export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  const fields = {
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    err,
  };

  if (isStaleServerAction(err)) {
    logger.warn("nextjs.stale_server_action", fields);
    return;
  }

  logger.error("nextjs.request_error", fields);
};
