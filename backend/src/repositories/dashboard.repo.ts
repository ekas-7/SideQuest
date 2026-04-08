import type { PoolClient } from "../config/database.ts";
import { query } from "../config/database.ts";

export async function getPendingVerificationCountRepo(userId: string, client?: PoolClient): Promise<number> {
  const result = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM verification_assignments va
      JOIN verification_jobs vj ON vj.id = va.job_id
      WHERE va.voter_user_id = $1
        AND va.vote IS NULL
        AND vj.status = 'pending'
    `,
    [userId],
    client,
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function upsertStatHistoryRepo(
  userId: string,
  metric: "streak" | "xp" | "trust",
  value: number,
  client?: PoolClient,
): Promise<void> {
  await query(
    `
      INSERT INTO user_stat_history (user_id, metric, value, recorded_at)
      VALUES ($1, $2, $3, CURRENT_DATE)
      ON CONFLICT (user_id, metric, recorded_at)
      DO UPDATE SET value = EXCLUDED.value
    `,
    [userId, metric, value],
    client,
  );
}

export async function getStatHistoryRepo(
  userId: string,
  metric: "streak" | "xp" | "trust",
  client?: PoolClient,
): Promise<{ date: string; value: number }[]> {
  const result = await query<{ date: string; value: number }>(
    `
      SELECT recorded_at::text AS date, value
      FROM user_stat_history
      WHERE user_id = $1 AND metric = $2
      ORDER BY recorded_at ASC
    `,
    [userId, metric],
    client,
  );

  return result.rows;
}

export async function getLeaderboardRepo(
  window: "weekly" | "all_time",
  limit: number,
  client?: PoolClient,
): Promise<Array<{ userId: string; username: string; xp: number; trustScore: number; streak: number }>> {
  const rangeFilter =
    window === "weekly"
      ? `WHERE EXISTS (
            SELECT 1 FROM weekly_quests wq
            WHERE wq.user_id = u.id
              AND wq.verified_at IS NOT NULL
              AND wq.verified_at >= date_trunc('week', now())
         )`
      : "";

  const result = await query<{
    user_id: string;
    username: string;
    xp: number;
    trust_score: number;
    streak: number;
  }>(
    `
      SELECT u.id AS user_id, u.username, u.xp, u.trust_score, u.streak
      FROM users u
      ${rangeFilter}
      ORDER BY u.xp DESC, u.trust_score DESC, u.streak DESC
      LIMIT $1
    `,
    [limit],
    client,
  );

  return result.rows.map((row) => ({
    userId: row.user_id,
    username: row.username,
    xp: row.xp,
    trustScore: row.trust_score,
    streak: row.streak,
  }));
}
