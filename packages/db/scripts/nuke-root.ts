#!/usr/bin/env node
// Fresh schema + root org and internal users. The default dev reset.
import { resetSchema, run, scriptsDir } from "./run";

resetSchema();
run("Seeding root org + users", "pnpm run seed:root", scriptsDir);
