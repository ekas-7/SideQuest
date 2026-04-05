import type { QueryExecutor } from "../config/database.ts";
import type { WeeklyQuest } from "../models/quest.model.ts";
import * as questCatalogRepo from "../repositories/quest-catalog.repo.ts";
import * as weeklyActionRepo from "../repositories/weekly-action.repo.ts";
import * as weeklyQuestRepo from "../repositories/weekly-quest.repo.ts";

export const listRandomCatalogItems = (count: number, excludeQuestIds: number[] = [], executor?: QueryExecutor) =>
  questCatalogRepo.listRandomQuestCatalogItems(count, excludeQuestIds, executor);

export const listAllCatalogItems = (executor?: QueryExecutor) => questCatalogRepo.listAllQuestCatalogItems(executor);

export const listWeeklyQuestsByUserWeek = (userId: string, weekStart: string, executor?: QueryExecutor) =>
  weeklyQuestRepo.listWeeklyQuestsByUserAndWeek(userId, weekStart, executor);

export const createWeeklyQuests = (userId: string, weekStart: string, questIds: number[], executor?: QueryExecutor) =>
  weeklyQuestRepo.createWeeklyQuestsForUser(userId, weekStart, questIds, executor);

export const deleteWeeklyQuests = (userId: string, weekStart: string, executor?: QueryExecutor) =>
  weeklyQuestRepo.deleteWeeklyQuestsByUserAndWeek(userId, weekStart, executor);

export const getWeeklyQuestById = (weeklyQuestId: number, executor?: QueryExecutor) =>
  weeklyQuestRepo.getWeeklyQuestById(weeklyQuestId, executor);

export const submitWeeklyQuestProof = (
  weeklyQuestId: number,
  description: string,
  proofUrl: string,
  executor?: QueryExecutor,
) => weeklyQuestRepo.updateWeeklyQuestProof(weeklyQuestId, description, proofUrl, executor);

export const decideWeeklyQuest = (weeklyQuestId: number, approved: boolean, executor?: QueryExecutor) =>
  weeklyQuestRepo.markWeeklyQuestDecision(weeklyQuestId, approved, executor);

export const ensureWeeklyAction = (userId: string, weekStart: string, executor?: QueryExecutor) =>
  weeklyActionRepo.getOrCreateWeeklyAction(userId, weekStart, executor);

export const markWeeklyRerollUsed = (userId: string, weekStart: string, executor?: QueryExecutor) =>
  weeklyActionRepo.markWeeklyRerollUsed(userId, weekStart, executor);

export const listWeeklyQuestsMissingJobs = (executor?: QueryExecutor): Promise<WeeklyQuest[]> =>
  weeklyQuestRepo.listWeeklyQuestsWithoutJob(executor);
