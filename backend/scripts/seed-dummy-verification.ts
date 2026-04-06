/**
 * Inserts a submitted weekly quest from a dummy user and assigns your user
 * as a verification voter so you can test the Verify UI.
 *
 * Usage (from repo root or backend/):
 *   bun run scripts/seed-dummy-verification.ts aymn
 *
 * Requires DATABASE_URL (e.g. from .env or docker-compose).
 */
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";

loadEnv({ path: ".env" });

const DAY_MS = 24 * 60 * 60 * 1000;

function getWeekStartSundayUtc(d = new Date()): string {
  const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const day = new Date(utc).getUTCDay();
  const sunday = new Date(utc - day * DAY_MS);
  return sunday.toISOString().slice(0, 10);
}

const DUMMY_USER_ID = "00000000-0000-4000-8000-00000000d001";
const DUMMY_USERNAME = "_seed_dummy_submitter";

async function main() {
  const voterUsername = (process.argv[2] ?? "aymn").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const weekStart = getWeekStartSundayUtc();

  try {
    const voterRes = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE lower(username) = lower($1)`,
      [voterUsername]
    );
    const voter = voterRes.rows[0];
    if (!voter) {
      console.error(`No user with username "${voterUsername}". Register in the app first.`);
      process.exit(1);
    }

    await pool.query(
      `
      INSERT INTO users (id, username)
      VALUES ($1, $2)
      ON CONFLICT (id) DO NOTHING
    `,
      [DUMMY_USER_ID, DUMMY_USERNAME]
    );

    await pool.query(
      `
      INSERT INTO weekly_actions (user_id, week_start, reroll_used)
      VALUES ($1, $2, false)
      ON CONFLICT (user_id, week_start) DO NOTHING
    `,
      [DUMMY_USER_ID, weekStart]
    );

    const catalog = await pool.query<{ id: number }>(
      `SELECT id FROM quest_catalog ORDER BY id LIMIT 1`
    );
    const questId = catalog.rows[0]?.id ?? 1;

    const wsqRes = await pool.query<{ id: number }>(
      `
      INSERT INTO weekly_side_quests (
        user_id, week_start, slot, quest_id,
        status, proof_description, proof_url, submitted_at
      )
      VALUES ($1, $2, 1, $3, 'submitted', $4, $5, NOW())
      ON CONFLICT (user_id, week_start, slot) DO UPDATE SET
        quest_id = EXCLUDED.quest_id,
        status = 'submitted',
        proof_description = EXCLUDED.proof_description,
        proof_url = EXCLUDED.proof_url,
        submitted_at = NOW(),
        verified_at = NULL
      RETURNING id
    `,
      [
        DUMMY_USER_ID,
        weekStart,
        questId,
        "Dummy proof for local testing — completed the morning sprint.",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
      ]
    );

    const weeklySideQuestId = wsqRes.rows[0]?.id;
    if (weeklySideQuestId == null) {
      throw new Error("Failed to upsert weekly_side_quests row.");
    }

    const jobRes = await pool.query<{ id: number }>(
      `
      INSERT INTO verification_jobs (weekly_side_quest_id, required_votes, status)
      VALUES ($1, 5, 'pending')
      ON CONFLICT (weekly_side_quest_id) DO UPDATE SET
        status = 'pending',
        decided_at = NULL
      RETURNING id
    `,
      [weeklySideQuestId]
    );

    const jobId = jobRes.rows[0]?.id;
    if (jobId == null) {
      throw new Error("Failed to upsert verification_jobs row.");
    }

    await pool.query(
      `
      INSERT INTO verification_assignments (job_id, voter_user_id)
      VALUES ($1, $2)
      ON CONFLICT (job_id, voter_user_id) DO UPDATE SET
        vote = NULL,
        responded_at = NULL,
        trust_delta_applied = FALSE
    `,
      [jobId, voter.id]
    );

    console.log(`Week start (UTC Sunday): ${weekStart}`);
    console.log(`Voter: @${voterUsername} (${voter.id})`);
    console.log(`Dummy submitter: @${DUMMY_USERNAME} (${DUMMY_USER_ID})`);
    console.log(`weekly_side_quests.id: ${weeklySideQuestId}, verification_jobs.id: ${jobId}`);
    console.log("Done — open Verify in the app and refresh.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
