import type { PoolConfig } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "./types";
import { env } from "./env";

const sslDisabled = env.DATABASE_URL?.includes("sslmode=disable");

const poolConfig: PoolConfig = {
  ...(env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL }
    : {
        user: env.DATABASE_USER,
        password: env.DATABASE_PASSWORD,
        host: env.DATABASE_HOST,
        port: env.DATABASE_PORT,
        database: env.DATABASE_NAME,
      }),
  ssl: sslDisabled ? false : { rejectUnauthorized: false },
};
export const dialect = new PostgresDialect({
  pool: new Pool(poolConfig),
});

export type Database = Kysely<DB>;
export const db = new Kysely<DB>({
  dialect,
});
