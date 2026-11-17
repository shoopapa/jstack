import type { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

import type { Logger } from "@jstack/logger";

/**
 * True for errors that are the caller's fault (4xx: bad input, missing
 * session, …) rather than a server fault (5xx).
 */
export const isClientError = (error: TRPCError) =>
  getHTTPStatusCodeFromError(error) < 500;

// Errors already logged by the timing middleware. The HTTP adapter's `onError`
// receives the same instance, so this keeps it from logging a second line.
const logged = new WeakSet<TRPCError>();

/**
 * Logs one structured line for a failed tRPC call. Server faults go out as
 * `trpc.error` at error level (what you alarm on); client errors as
 * `trpc.client_error` at warn, so a burst of bad input or expired sessions is
 * visible without paging anyone. Safe to call more than
 * once per error — only the first call logs.
 */
export function logTrpcError(
  log: Logger,
  opts: { path: string | undefined; error: TRPCError },
) {
  const { path, error } = opts;
  if (logged.has(error)) return;
  logged.add(error);

  if (isClientError(error)) {
    log.warn("trpc.client_error", { path, code: error.code });
    return;
  }
  log.error("trpc.error", { path, err: error });
}
