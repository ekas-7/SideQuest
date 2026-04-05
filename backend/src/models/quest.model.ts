import type { StatFocus } from "./user.model.ts";

export type WeeklyQuestStatus = "assigned" | "submitted" | "verified" | "rejected";

export interface QuestCatalogItem {
  id: number;
  title: string;
  description: string;
  toughness: number;
  statFocus: StatFocus;
}

export interface WeeklyQuest {
  id: number;
  userId: string;
  weekStart: string;
  slot: number;
  status: WeeklyQuestStatus;
  proofDescription: string | null;
  proofUrl: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  quest: QuestCatalogItem;
}
