import type { QueryResultRow } from "pg";

import type { QuestCatalogItem } from "../models/quest.model.ts";
import { type QueryExecutor, db } from "../config/database.ts";

interface QuestCatalogRow extends QueryResultRow {
  id: number;
  title: string;
  description: string;
  toughness: number;
  stat_focus: QuestCatalogItem["statFocus"];
}

const mapQuestCatalog = (row: QuestCatalogRow): QuestCatalogItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  toughness: row.toughness,
  statFocus: row.stat_focus,
});

export const listRandomQuestCatalogItems = async (
  count: number,
  excludeQuestIds: number[] = [],
  executor: QueryExecutor = db,
): Promise<QuestCatalogItem[]> => {
  const { rows } = await executor.query<QuestCatalogRow>(
    `
      SELECT id, title, description, toughness, stat_focus
      FROM quest_catalog
      WHERE ($2::int[] IS NULL OR id <> ALL($2::int[]))
      ORDER BY RANDOM()
      LIMIT $1
    `,
    [count, excludeQuestIds.length ? excludeQuestIds : null],
  );

  return rows.map(mapQuestCatalog);
};

export const listAllQuestCatalogItems = async (executor: QueryExecutor = db): Promise<QuestCatalogItem[]> => {
  const { rows } = await executor.query<QuestCatalogRow>(
    `
      SELECT id, title, description, toughness, stat_focus
      FROM quest_catalog
      ORDER BY id ASC
    `,
  );

  return rows.map(mapQuestCatalog);
};
