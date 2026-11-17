import { afterAll } from "vitest";

import { db } from "@jstack/db";

// Runs before any test imports `../src`, which is when `initTRPC.create()`
// reads NODE_ENV. Anything other than "production" counts as dev and the
// timing middleware then sleeps 100-500ms on every call.
process.env.NODE_ENV = "production";

// One structured log line per request buries the reporter.
// Override with `LOG_LEVEL=info pnpm test`.
process.env.LOG_LEVEL ??= "error";

// Each test file opens its own pool; close it or the worker hangs on exit.
afterAll(async () => {
  await db.destroy();
});
