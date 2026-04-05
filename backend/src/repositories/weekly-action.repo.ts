import type { QueryResultRow } from "pg";

import { type QueryExecutor, db } from "../config/database.ts";

interface WeeklyActionRow extends QueryResultRow {
  user_id: string;
  week_start: string;
  reroll_used: boolean;
}

export interface WeeklyAction {
  userId: string;
  weekStart: string;
  rerollUsed: boolean;
}

const mapWeeklyAction = (row: WeeklyActionRow): WeeklyAction => ({
  userId: row.user_id,
  weekStart: row.week_start,
  rerollUsed: row.reroll_used,
});

export const getOrCreateWeeklyAction = async (
  userId: string,
  weekStart: string,
  executor: QueryExecutor = db,
): Promise<WeeklyAction> => {
  const { rows } = await executor.query<WeeklyActionRow>(
    `
      INSERT INTO weekly_actions (user_id, week_start)
      VALUES ($1, $2)
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET user_id = EXCLUDED.user_id
      RETURNING user_id, week_start, reroll_used
    `,
    [userId, weekStart],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to upsert weekly action.");
  }

  return mapWeeklyAction(row);
};

export const markWeeklyRerollUsed = async (
  userId: string,
  weekStart: string,
  executor: QueryExecutor = db,
): Promise<void> => {
  await executor.query(
    `
      UPDATE weekly_actions
      SET reroll_used = TRUE
      WHERE user_id = $1 AND week_start = $2
    `,
    [userId, weekStart],
  );
};
