// Structured JSON logger built on pino. Every call emits ONE line of JSON to
// stdout, so any log aggregator can ingest it as a structured event and filter
// on fields (e.g. `level = "error"`).
//
// The exported API is `(msg, fields)` — the reverse of pino's native
// `(obj, msg)` — because that reads better at the call sites and keeps the log
// message the first thing you see in a diff.
//
// Usage:
//   import { logger } from "@jstack/logger";
//   logger.info("trpc.request", { path, durationMs });
//   const log = logger.child({ requestId, orgId });   // per-request context
//   log.error("post.create_failed", { err });

import pino from "pino";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

export interface Logger {
  debug: (msg: string, fields?: LogFields) => void;
  info: (msg: string, fields?: LogFields) => void;
  warn: (msg: string, fields?: LogFields) => void;
  error: (msg: string, fields?: LogFields) => void;
  /** Returns a logger that merges `base` into every record it emits. */
  child: (base: LogFields) => Logger;
}

function resolveLevel(): LogLevel {
  // The logger is the one place that reads LOG_LEVEL directly — everything else
  // goes through validated env. Default to `info` when unset/invalid.
  // eslint-disable-next-line no-restricted-properties -- logger threshold, not app config
  const raw = process.env.LOG_LEVEL;
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

const root = pino(
  {
    level: resolveLevel(),
    // Log filters match on `level = "error"`, so levels must serialize as
    // their string label rather than pino's default numeric rank.
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Drop pino's default pid/hostname — in containers and serverless runtimes
    // the log stream already identifies the source.
    base: undefined,
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  },
  // Synchronous: pino's default buffered destination can lose lines when a
  // serverless runtime freezes between invocations.
  pino.destination({ fd: 1, sync: true }),
);

function wrap(instance: pino.Logger): Logger {
  return {
    debug: (msg, fields) => instance.debug(fields ?? {}, msg),
    info: (msg, fields) => instance.info(fields ?? {}, msg),
    warn: (msg, fields) => instance.warn(fields ?? {}, msg),
    error: (msg, fields) => instance.error(fields ?? {}, msg),
    child: (base) => wrap(instance.child(base)),
  };
}

/** The root logger. Call `.child({...})` to attach per-request context. */
export const logger: Logger = wrap(root);
