import { promises as fs } from "fs";
import * as path from "path";
import { command, flag, run, subcommands } from "cmd-ts";
import { FileMigrationProvider, Migrator } from "kysely/migration";

import { db } from "./db";
import { env } from "./env";

function createMigrator(): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, "../migrations"),
    }),
  });
}

async function executeAndReport(
  action: (
    migrator: Migrator,
  ) => Promise<Awaited<ReturnType<Migrator["migrateToLatest"]>>>,
) {
  const migrator = createMigrator();
  try {
    const { error, results } = await action(migrator);

    results?.forEach((it) => {
      if (it.status === "Success") {
        console.log(
          `migration "${it.migrationName}" was executed successfully`,
        );
      } else if (it.status === "Error") {
        console.error(`failed to execute migration "${it.migrationName}"`);
      }
    });

    if (error) {
      console.error("failed to migrate");
      console.error(error);
      process.exitCode = 1;
    }
  } finally {
    await db.destroy();
  }
}

const up = command({
  name: "up",
  description: "Migrate one step up",
  args: {},
  handler: async () => {
    await executeAndReport((m) => m.migrateUp());
  },
});

const down = command({
  name: "down",
  description: "Migrate one step down",
  args: {},
  handler: async () => {
    await executeAndReport((m) => m.migrateDown());
  },
});

const latest = command({
  name: "latest",
  description: "Run all pending migrations",
  args: {},
  handler: async () => {
    await executeAndReport((m) => m.migrateToLatest());
  },
});

const bottom = command({
  name: "bottom",
  description: "down all migrations to the bottom",
  args: {
    iKnowWhatIAmDoing: flag({
      long: "i-know-what-i-am-doing",
      description: "Override local-only check",
      env: "I_KNOW_WHAT_I_AM_DOING",
    }),
  },
  handler: async ({ iKnowWhatIAmDoing }) => {
    const runBottom = async () => {
      const migrator = createMigrator();
      const migrations = (await migrator.getMigrations())
        .filter((m) => m.executedAt)
        .reverse();

      for (const migration of migrations) {
        if (!migration.migration.down) {
          console.error(
            `No down function for migration ${migration.name} — cannot migrate below it.`,
          );
          await db.destroy();
          process.exit(1);
        }

        console.log("migrating down", migration.name);

        const { error, results } = await migrator.migrateDown();
        const failed = results?.find((it) => it.status === "Error");
        if (error ?? failed) {
          console.error(`failed to migrate down "${migration.name}"`);
          if (error) console.error(error);
          await db.destroy();
          process.exit(1);
        }
      }
      await db.destroy();
    };

    if (process.env.CI) {
      console.error("This command is not available in CI.");
      process.exit(1);
    }

    const isLocal = env.DATABASE_URL?.startsWith(
      "postgres://postgres:postgres@localhost:5300/postgres",
    );
    if (isLocal || iKnowWhatIAmDoing) {
      await runBottom();
    } else {
      console.error("This command is only available for local development.");
      console.error("Or run `I_KNOW_WHAT_I_AM_DOING=true pnpm migrate:bottom`");
      process.exit(1);
    }
  },
});

const app = subcommands({
  name: "migrate",
  description: "Database migration commands",
  cmds: { up, down, latest, bottom },
});

void run(app, process.argv.slice(2));
