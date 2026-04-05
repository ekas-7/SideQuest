import { runInTransaction } from "../config/database.ts";
import { HttpError } from "../utils/http-error.ts";
import { getWeekStartSunday, isWithinWeek } from "../utils/week.ts";
import * as questService from "../services/quest.service.ts";
import * as userService from "../services/user.service.ts";
import * as verificationService from "../services/verification.service.ts";

const QUESTS_PER_WEEK = 3;
const MAX_VOTERS = 9;
const REQUIRED_VOTES = 5;

export const getOrAssignWeeklyQuests = async (userId: string, date: Date = new Date()) => {
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  const weekStart = getWeekStartSunday(date);
  const existing = await questService.listWeeklyQuestsByUserWeek(userId, weekStart);

  if (existing.length === QUESTS_PER_WEEK) {
    return {
      weekStart,
      quests: existing,
      rerollUsed: (await questService.ensureWeeklyAction(userId, weekStart)).rerollUsed,
      source: "existing" as const,
    };
  }

  return runInTransaction(async (client) => {
    const afterDelete = await questService.listWeeklyQuestsByUserWeek(userId, weekStart, client);
    if (afterDelete.length && afterDelete.length !== QUESTS_PER_WEEK) {
      await questService.deleteWeeklyQuests(userId, weekStart, client);
    }

    const picks = await questService.listRandomCatalogItems(QUESTS_PER_WEEK, [], client);
    if (picks.length < QUESTS_PER_WEEK) {
      throw new HttpError(400, "Not enough quest catalog items configured.");
    }

    await questService.createWeeklyQuests(
      userId,
      weekStart,
      picks.map((item) => item.id),
      client,
    );

    const quests = await questService.listWeeklyQuestsByUserWeek(userId, weekStart, client);
    const action = await questService.ensureWeeklyAction(userId, weekStart, client);

    return {
      weekStart,
      quests,
      rerollUsed: action.rerollUsed,
      source: "new" as const,
    };
  });
};

export const rerollWeeklyQuests = async (userId: string, date: Date = new Date()) => {
  const weekStart = getWeekStartSunday(date);

  return runInTransaction(async (client) => {
    const current = await getOrAssignWeeklyQuests(userId, date);
    const action = await questService.ensureWeeklyAction(userId, weekStart, client);

    if (action.rerollUsed) {
      throw new HttpError(409, "Reroll has already been used for this week.");
    }

    const currentQuestIds = current.quests.map((quest) => quest.quest.id);
    const replacement = await questService.listRandomCatalogItems(QUESTS_PER_WEEK, currentQuestIds, client);

    if (replacement.length < QUESTS_PER_WEEK) {
      throw new HttpError(400, "Not enough alternative quests available for reroll.");
    }

    await questService.deleteWeeklyQuests(userId, weekStart, client);
    await questService.createWeeklyQuests(
      userId,
      weekStart,
      replacement.map((item) => item.id),
      client,
    );
    await questService.markWeeklyRerollUsed(userId, weekStart, client);

    return {
      weekStart,
      quests: await questService.listWeeklyQuestsByUserWeek(userId, weekStart, client),
      rerollUsed: true,
      source: "rerolled" as const,
    };
  });
};

export const submitQuestProof = async (
  weeklyQuestId: number,
  userId: string,
  description: string,
  proofUrl: string,
  date: Date = new Date(),
) => {
  const quest = await questService.getWeeklyQuestById(weeklyQuestId);
  if (!quest) {
    throw new HttpError(404, "Weekly quest not found.");
  }

  if (quest.userId !== userId) {
    throw new HttpError(403, "You can only submit proof for your own quests.");
  }

  if (quest.status === "verified") {
    throw new HttpError(409, "Quest already verified.");
  }

  if (!isWithinWeek(date, quest.weekStart)) {
    throw new HttpError(400, "Proof submission is only allowed during the active week.");
  }

  return runInTransaction(async (client) => {
    await questService.submitWeeklyQuestProof(weeklyQuestId, description, proofUrl, client);

    const job = await verificationService.createJob(weeklyQuestId, REQUIRED_VOTES, client);
    const voters = await userService.listRandomVoters(userId, MAX_VOTERS, client);

    await verificationService.createAssignments(
      job.id,
      voters.map((voter) => voter.id),
      client,
    );

    return {
      weeklyQuestId,
      verificationJobId: job.id,
      assignedVoters: voters.length,
      requiredVotes: REQUIRED_VOTES,
    };
  });
};
