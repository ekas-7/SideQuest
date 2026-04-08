import { runInTransaction } from "../config/database.ts";
import type { WeeklyQuestsResponse } from "../models/types.ts";
import { questService } from "../services/quest.service.ts";
import { userService } from "../services/user.service.ts";
import { verificationService } from "../services/verification.service.ts";
import { HttpError } from "../utils/http.ts";
import { getWeekStartISO } from "../utils/week.ts";

const WEEKLY_QUEST_COUNT = 3;
const VOTER_ASSIGNMENT_COUNT = 9;

async function ensureAssigned(userId: string, weekStart: string): Promise<WeeklyQuestsResponse> {
  return runInTransaction(async (client) => {
    let quests = await questService.getWeeklyQuests(userId, weekStart, client);
    if (quests.length === 0) {
      const randomIds = await questService.getRandomQuestIds(WEEKLY_QUEST_COUNT, client);
      if (randomIds.length < WEEKLY_QUEST_COUNT) {
        throw new HttpError(500, "CATALOG_TOO_SMALL", "Not enough quest catalog records");
      }
      await questService.assignWeeklyQuests(userId, weekStart, randomIds, client);
      quests = await questService.getWeeklyQuests(userId, weekStart, client);
    }

    const rerolled = await questService.hasRerolled(userId, weekStart, client);
    return {
      userId,
      weekStart,
      quests,
      canReroll: !rerolled,
    };
  });
}

export async function getQuestCatalogOrchestrator() {
  return questService.getCatalog();
}

export async function getWeeklyQuestsOrchestrator(userId: string, date?: string) {
  const weekStart = getWeekStartISO(date);
  return ensureAssigned(userId, weekStart);
}

export async function rerollWeeklyQuestsOrchestrator(userId: string, date?: string) {
  const weekStart = getWeekStartISO(date);

  return runInTransaction(async (client) => {
    const used = await questService.hasRerolled(userId, weekStart, client);
    if (used) {
      throw new HttpError(409, "REROLL_ALREADY_USED", "Weekly reroll already used");
    }

    await questService.deleteWeeklyQuests(userId, weekStart, client);
    const randomIds = await questService.getRandomQuestIds(WEEKLY_QUEST_COUNT, client);
    if (randomIds.length < WEEKLY_QUEST_COUNT) {
      throw new HttpError(500, "CATALOG_TOO_SMALL", "Not enough quest catalog records");
    }

    await questService.assignWeeklyQuests(userId, weekStart, randomIds, client);
    await questService.useReroll(userId, weekStart, client);

    const quests = await questService.getWeeklyQuests(userId, weekStart, client);

    return {
      userId,
      weekStart,
      quests,
      canReroll: false,
    };
  });
}

export async function getWeeklyHistoryOrchestrator(userId: string, limit: number, cursor?: number) {
  const items = await questService.getWeeklyHistory(userId, limit, cursor);
  const nextCursor = items.length === limit ? String(items[items.length - 1]?.id ?? "") : null;
  return { items, nextCursor: nextCursor || null };
}

export async function submitProofOrchestrator(
  weeklyQuestId: number,
  userId: string,
  description: string,
  proofUrl: string,
) {
  return runInTransaction(async (client) => {
    const weeklyQuest = await questService.getWeeklyQuestById(weeklyQuestId, client);
    if (!weeklyQuest) {
      throw new HttpError(404, "WEEKLY_QUEST_NOT_FOUND", "Weekly quest not found");
    }

    if (weeklyQuest.userId !== userId) {
      throw new HttpError(403, "NOT_QUEST_OWNER", "Only the quest owner can submit proof");
    }

    if (weeklyQuest.status !== "assigned") {
      throw new HttpError(422, "INVALID_QUEST_STATE", "Quest is not in an assignable state");
    }

    await questService.submitProof(weeklyQuestId, description, proofUrl, client);

    const jobId = await verificationService.createVerificationJob(weeklyQuestId, client);
    const voterUserIds = await userService.listUsersExcluding(userId, VOTER_ASSIGNMENT_COUNT, client);
    await verificationService.createAssignments(jobId, voterUserIds, client);

    return {
      weeklyQuestId,
      verificationJobId: jobId,
      status: "submitted" as const,
    };
  });
}
