import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Validate env at build time. jiti lets us load the .ts file here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /** Hot reload workspace packages without a build step */
  transpilePackages: [
    "@jstack/api",
    "@jstack/auth",
    "@jstack/db",
    "@jstack/logger",
    "@jstack/ui",
    "@jstack/validators",
  ],

  /** pino resolves its transports at runtime — keep it out of the bundle */
  serverExternalPackages: ["pino"],

  /** Lint and typecheck run as separate turbo tasks */
  typescript: { ignoreBuildErrors: true },

  /**
   * TypeScript 7 exposes no JS Compiler API, so Next has to reach `tsc`
   * through the CLI — without this it throws reading tsconfig.
   */
  experimental: { useTypeScriptCli: true },

  /** Keep agent guidance at the repository root. */
  agentRules: false,

  /** Self-contained server for Docker (see Dockerfile) */
  output: "standalone",
};

export default config;
