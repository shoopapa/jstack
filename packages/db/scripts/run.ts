import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const root = resolve(here, "../../..");
export const dbDir = resolve(root, "packages/db");
export const scriptsDir = resolve(root, "packages/scripts");

export function run(label: string, cmd: string, cwd = root): void {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"─".repeat(60)}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

/** Wipe the dev container + volume, start fresh, migrate, regenerate types. */
export function resetSchema(): void {
  run("Wiping dev database", "pnpm run local:wipe", dbDir);
  run("Starting database", "pnpm run local:up", dbDir);
  run("Applying all migrations", "pnpm run migrate:latest", dbDir);
  run("Regenerating types", "pnpm run codegen", dbDir);
}
