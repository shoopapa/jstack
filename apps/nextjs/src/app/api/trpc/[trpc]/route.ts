import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext, logTrpcError } from "@jstack/api";
import { logger } from "@jstack/logger";

import { auth } from "~/auth/server";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => createTRPCContext({ headers: req.headers, auth }),
    onError({ error, path, ctx }) {
      // Procedure failures are already logged by the timing middleware; this
      // catches what fails before it runs (unknown path, context throwing).
      logTrpcError(ctx?.log ?? logger, { path, error });
    },
  });

export { handler as GET, handler as POST };
