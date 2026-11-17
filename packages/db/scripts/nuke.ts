#!/usr/bin/env node
// Fresh schema + root org + a fully seeded demo org.
//   pnpm --filter @jstack/db nuke [--slug demo]
import { resetSchema, run, scriptsDir } from "./run";

const slugIdx = process.argv.indexOf("--slug");
const orgSlug = slugIdx !== -1 ? (process.argv[slugIdx + 1] ?? "demo") : "demo";

resetSchema();
run("Seeding root org + users", "pnpm run seed:root", scriptsDir);
run("Creating org", `pnpm run create:org -- --slug ${orgSlug}`, scriptsDir);
run(
  "Seeding org members + content",
  `pnpm run seed:org -- --slug ${orgSlug}`,
  scriptsDir,
);
