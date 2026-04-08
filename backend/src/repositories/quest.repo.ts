import type { PoolClient } from "../config/database.ts";
import { query } from "../config/database.ts";
import type { QuestCatalogItem, WeeklyQuest } from "../models/types.ts";

type CatalogRow = {
  id: number;
  title: string;
  description: string;
  toughness: number;
  stat_focus: "strength" | "agility" | "intelligence";
};

type WeeklyQuestRow = {
  id: number;
  user_id: string;
  week_start: string;
  slot: number;
  status: "assigned" | "submitted" | "verified" | "rejected";
  proof_description: string | null;
  proof_url: string | null;
  submitted_at: Date | null;
  verified_at: Date | null;
  created_at: Date;
  quest_id: number;
  quest_title: string;
  quest_description: string;
  quest_toughness: number;
  quest_stat_focus: "strength" | "agility" | "intelligence";
};

function mapCatalog(row: CatalogRow): QuestCatalogItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    toughness: row.toughness,
    statFocus: row.stat_focus,
  };
}

function mapWeekly(row: WeeklyQuestRow): WeeklyQuest {
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    slot: row.slot,
    status: row.status,
    proofDescription: row.proof_description,
    proofUrl: row.proof_url,
    submittedAt: row.submitted_at ? row.submitted_at.toISOString() : null,
    verifiedAt: row.verified_at ? row.verified_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    quest: {
      id: row.quest_id,
      title: row.quest_title,
      description: row.quest_description,
      toughness: row.quest_toughness,
      statFocus: row.quest_stat_focus,
    },
  };
}

export async function getQuestCatalogRepo(client?: PoolClient): Promise<QuestCatalogItem[]> {
  const result = await query<CatalogRow>(
    `SELECT id, title, description, toughness, stat_focus FROM quest_catalog ORDER BY id ASC`,
    [],
    client,
  );
  return result.rows.map(mapCatalog);
}

export async function getWeeklyQuestsRepo(userId: string, weekStart: string, client?: PoolClient): Promise<WeeklyQuest[]> {
  const result = await query<WeeklyQuestRow>(
    `
      SELECT
        wq.id,
        wq.user_id,
        wq.week_start::text,
        wq.slot,
        wq.status,
        wq.proof_description,
        wq.proof_url,
        wq.submitted_at,
        wq.verified_at,
        wq.created_at,
        qc.id AS quest_id,
        qc.title AS quest_title,
        qc.description AS quest_description,
        qc.toughness AS quest_toughness,
        qc.stat_focus AS quest_stat_focus
      FROM weekly_quests wq
      JOIN quest_catalog qc ON qc.id = wq.quest_id
      WHERE wq.user_id = $1 AND wq.week_start = $2
      ORDER BY wq.slot ASC
    `,
    [userId, weekStart],
    client,
  );

  return result.rows.map(mapWeekly);
}

export async function assignWeeklyQuestsRepo(
  userId: string,
  weekStart: string,
  questIds: number[],
  client?: PoolClient,
): Promise<void> {
  for (let i = 0; i < questIds.length; i += 1) {
    await query(
      `
        INSERT INTO weekly_quests (user_id, week_start, slot, quest_id, status)
        VALUES ($1, $2, $3, $4, 'assigned')
      `,
      [userId, weekStart, i + 1, questIds[i]],
      client,
    );
  }
}

export async function deleteWeeklyQuestsRepo(userId: string, weekStart: string, client?: PoolClient): Promise<void> {
  await query(`DELETE FROM weekly_quests WHERE user_id = $1 AND week_start = $2`, [userId, weekStart], client);
}

export async function getRandomQuestIdsRepo(limit: number, client?: PoolClient): Promise<number[]> {
  const result = await query<{ id: number }>(
    `SELECT id FROM quest_catalog ORDER BY random() LIMIT $1`,
    [limit],
    client,
  );
  return result.rows.map((row) => row.id);
}

export async function hasRerolledRepo(userId: string, weekStart: string, client?: PoolClient): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM quest_rerolls WHERE user_id = $1 AND week_start = $2) AS exists`,
    [userId, weekStart],
    client,
  );
  return result.rows[0]?.exists ?? false;
}

export async function useRerollRepo(userId: string, weekStart: string, client?: PoolClient): Promise<void> {
  await query(
    `INSERT INTO quest_rerolls (user_id, week_start) VALUES ($1, $2)`,
    [userId, weekStart],
    client,
  );
}

export async function submitProofRepo(
  weeklyQuestId: number,
  description: string,
  proofUrl: string,
  client?: PoolClient,
): Promise<void> {
  await query(
    `
      UPDATE weekly_quests
      SET status = 'submitted',
          proof_description = $2,
          proof_url = $3,
          submitted_at = NOW()
      WHERE id = $1
    `,
    [weeklyQuestId, description, proofUrl],
    client,
  );
}

export async function getWeeklyQuestByIdRepo(
  weeklyQuestId: number,
  client?: PoolClient,
): Promise<WeeklyQuest | null> {
  const result = await query<WeeklyQuestRow>(
    `
      SELECT
        wq.id,
        wq.user_id,
        wq.week_start::text,
        wq.slot,
        wq.status,
        wq.proof_description,
        wq.proof_url,
        wq.submitted_at,
        wq.verified_at,
        wq.created_at,
        qc.id AS quest_id,
        qc.title AS quest_title,
        qc.description AS quest_description,
        qc.toughness AS quest_toughness,
        qc.stat_focus AS quest_stat_focus
      FROM weekly_quests wq
      JOIN quest_catalog qc ON qc.id = wq.quest_id
      WHERE wq.id = $1
      LIMIT 1
    `,
    [weeklyQuestId],
    client,
  );

  return result.rows[0] ? mapWeekly(result.rows[0]) : null;
}

export async function getWeeklyHistoryRepo(
  userId: string,
  limit: number,
  cursor?: number,
  client?: PoolClient,
): Promise<WeeklyQuest[]> {
  const params: unknown[] = [userId, limit];
  let cursorFilter = "";

  if (cursor) {
    params.push(cursor);
    cursorFilter = `AND wq.id < $${params.length}`;
  }

  const result = await query<WeeklyQuestRow>(
    `
      SELECT
        wq.id,
        wq.user_id,
        wq.week_start::text,
        wq.slot,
        wq.status,
        wq.proof_description,
        wq.proof_url,
        wq.submitted_at,
        wq.verified_at,
        wq.created_at,
        qc.id AS quest_id,
        qc.title AS quest_title,
        qc.description AS quest_description,
        qc.toughness AS quest_toughness,
        qc.stat_focus AS quest_stat_focus
      FROM weekly_quests wq
      JOIN quest_catalog qc ON qc.id = wq.quest_id
      WHERE wq.user_id = $1
      ${cursorFilter}
      ORDER BY wq.id DESC
      LIMIT $2
    `,
    params,
    client,
  );

  return result.rows.map(mapWeekly);
}

export async function markQuestVerifiedRepo(weeklyQuestId: number, client?: PoolClient): Promise<void> {
  await query(
    `UPDATE weekly_quests SET status = 'verified', verified_at = NOW() WHERE id = $1`,
    [weeklyQuestId],
    client,
  );
}

export async function markQuestRejectedRepo(weeklyQuestId: number, client?: PoolClient): Promise<void> {
  await query(`UPDATE weekly_quests SET status = 'rejected' WHERE id = $1`, [weeklyQuestId], client);
}
