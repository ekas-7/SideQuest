import type { QueryResultRow } from "pg";

import { type QueryExecutor, db } from "../config/database.ts";
import type { WeeklyQuest, WeeklyQuestStatus } from "../models/quest.model.ts";

interface WeeklyQuestRow extends QueryResultRow {
  id: number;
  user_id: string;
  week_start: string;
  slot: number;
  status: WeeklyQuestStatus;
  proof_description: string | null;
  proof_url: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
  quest_id: number;
  title: string;
  description: string;
  toughness: number;
  stat_focus: WeeklyQuest["quest"]["statFocus"];
}

interface WeeklyQuestLiteRow extends QueryResultRow {
  id: number;
  user_id: string;
  week_start: string;
  slot: number;
  status: WeeklyQuestStatus;
  proof_description: string | null;
  proof_url: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
  quest_id: number;
}

const baseSelect = `
  SELECT
    wsq.id,
    wsq.user_id,
    wsq.week_start,
    wsq.slot,
    wsq.status,
    wsq.proof_description,
    wsq.proof_url,
    wsq.submitted_at,
    wsq.verified_at,
    wsq.created_at,
    qc.id AS quest_id,
    qc.title,
    qc.description,
    qc.toughness,
    qc.stat_focus
  FROM weekly_side_quests wsq
  JOIN quest_catalog qc ON qc.id = wsq.quest_id
`;

const mapWeeklyQuest = (row: WeeklyQuestRow): WeeklyQuest => ({
  id: row.id,
  userId: row.user_id,
  weekStart: row.week_start,
  slot: row.slot,
  status: row.status,
  proofDescription: row.proof_description,
  proofUrl: row.proof_url,
  submittedAt: row.submitted_at,
  verifiedAt: row.verified_at,
  createdAt: row.created_at,
  quest: {
    id: row.quest_id,
    title: row.title,
    description: row.description,
    toughness: row.toughness,
    statFocus: row.stat_focus,
  },
});

export const listWeeklyQuestsByUserAndWeek = async (
  userId: string,
  weekStart: string,
  executor: QueryExecutor = db,
): Promise<WeeklyQuest[]> => {
  const { rows } = await executor.query<WeeklyQuestRow>(
    `${baseSelect}
      WHERE wsq.user_id = $1 AND wsq.week_start = $2
      ORDER BY wsq.slot ASC
    `,
    [userId, weekStart],
  );
  return rows.map(mapWeeklyQuest);
};

export const createWeeklyQuestsForUser = async (
  userId: string,
  weekStart: string,
  questIds: number[],
  executor: QueryExecutor = db,
): Promise<void> => {
  const inserts = questIds.map((questId, index) =>
    executor.query(
      `
        INSERT INTO weekly_side_quests (user_id, week_start, slot, quest_id)
        VALUES ($1, $2, $3, $4)
      `,
      [userId, weekStart, index + 1, questId],
    ),
  );

  await Promise.all(inserts);
};

export const deleteWeeklyQuestsByUserAndWeek = async (
  userId: string,
  weekStart: string,
  executor: QueryExecutor = db,
): Promise<void> => {
  await executor.query(
    `
      DELETE FROM weekly_side_quests
      WHERE user_id = $1 AND week_start = $2
    `,
    [userId, weekStart],
  );
};

export const getWeeklyQuestById = async (
  weeklyQuestId: number,
  executor: QueryExecutor = db,
): Promise<WeeklyQuest | null> => {
  const { rows } = await executor.query<WeeklyQuestRow>(
    `${baseSelect}
      WHERE wsq.id = $1
    `,
    [weeklyQuestId],
  );

  return rows[0] ? mapWeeklyQuest(rows[0]) : null;
};

export const updateWeeklyQuestProof = async (
  weeklyQuestId: number,
  description: string,
  proofUrl: string,
  executor: QueryExecutor = db,
): Promise<void> => {
  await executor.query(
    `
      UPDATE weekly_side_quests
      SET
        status = 'submitted',
        proof_description = $2,
        proof_url = $3,
        submitted_at = NOW()
      WHERE id = $1
    `,
    [weeklyQuestId, description, proofUrl],
  );
};

export const markWeeklyQuestDecision = async (
  weeklyQuestId: number,
  approved: boolean,
  executor: QueryExecutor = db,
): Promise<void> => {
  await executor.query(
    `
      UPDATE weekly_side_quests
      SET
        status = $2,
        verified_at = NOW()
      WHERE id = $1
    `,
    [weeklyQuestId, approved ? "verified" : "rejected"],
  );
};

export const listWeeklyQuestsWithoutJob = async (executor: QueryExecutor = db): Promise<WeeklyQuest[]> => {
  const { rows } = await executor.query<WeeklyQuestRow>(
    `${baseSelect}
      LEFT JOIN verification_jobs vj ON vj.weekly_side_quest_id = wsq.id
      WHERE wsq.status = 'submitted' AND vj.id IS NULL
    `,
  );

  return rows.map(mapWeeklyQuest);
};

export const getWeeklyQuestLiteById = async (
  weeklyQuestId: number,
  executor: QueryExecutor = db,
): Promise<WeeklyQuestLiteRow | null> => {
  const { rows } = await executor.query<WeeklyQuestLiteRow>(
    `
      SELECT id, user_id, week_start, slot, status, proof_description, proof_url, submitted_at, verified_at, created_at, quest_id
      FROM weekly_side_quests
      WHERE id = $1
    `,
    [weeklyQuestId],
  );

  return rows[0] ?? null;
};
