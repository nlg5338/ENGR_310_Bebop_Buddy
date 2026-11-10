import { Pool } from "pg";

// DATABASE_URL is the Neon connection string Vercel added to the project.
export const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Free accounts can generate this many solos per 24 hours.
export const FREE_DAILY_SOLOS = 3;

/** Creates the app's own tables (the login tables come from Better Auth). */
export async function createAppTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS solo_generation (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      progression TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS solo_generation_user_time ON solo_generation (user_id, created_at);

    -- One row per user who has started a checkout; kept in sync with Stripe.
    CREATE TABLE IF NOT EXISTS subscription (
      user_id                TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      stripe_customer_id     TEXT UNIQUE NOT NULL,
      stripe_subscription_id TEXT,
      status                 TEXT NOT NULL DEFAULT 'none',
      current_period_end     TIMESTAMPTZ,
      cancel_at_period_end   BOOLEAN NOT NULL DEFAULT false,
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export type Plan = {
  pro: boolean;
  renewsOrEnds: Date | null;
  canceling: boolean;
};

/** Whether the user has an active Pro subscription. */
export async function getPlan(userId: string): Promise<Plan> {
  const { rows } = await db.query<{ status: string; current_period_end: Date | null; cancel_at_period_end: boolean }>(
    `SELECT status, current_period_end, cancel_at_period_end FROM subscription WHERE user_id = $1`,
    [userId],
  );
  const sub = rows[0];
  return {
    pro: sub?.status === "active" || sub?.status === "trialing",
    renewsOrEnds: sub?.current_period_end ?? null,
    canceling: sub?.cancel_at_period_end ?? false,
  };
}

/** How many solos this user has left in the last 24 hours, or null if unlimited (Pro). */
export async function solosRemaining(userId: string): Promise<number | null> {
  if ((await getPlan(userId)).pro) return null;

  const { rows } = await db.query<{ count: string }>(
    `SELECT count(*) FROM solo_generation WHERE user_id = $1 AND created_at > now() - interval '24 hours'`,
    [userId],
  );
  return Math.max(0, FREE_DAILY_SOLOS - Number(rows[0].count));
}

export async function recordSolo(userId: string, progression: string) {
  await db.query(`INSERT INTO solo_generation (user_id, progression) VALUES ($1, $2)`, [userId, progression]);
}
