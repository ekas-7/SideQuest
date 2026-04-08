import { dashboardService } from "../services/dashboard.service.ts";
import { questService } from "../services/quest.service.ts";
import { userService } from "../services/user.service.ts";
import { HttpError } from "../utils/http.ts";
import { getWeekStartISO } from "../utils/week.ts";

export async function getDashboardOrchestrator(userId: string) {
  const user = await userService.getById(userId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const weekStart = getWeekStartISO();
  const weekly = {
    userId,
    weekStart,
    quests: await questService.getWeeklyQuests(userId, weekStart),
    canReroll: !(await questService.hasRerolled(userId, weekStart)),
  };

  const pendingVerification = await dashboardService.getPendingVerificationCount(userId);
  return { user, weekly, pendingVerification };
}

export async function getUserStatsOrchestrator(userId: string) {
  const user = await userService.getById(userId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const [streakHistory, xpHistory, trustHistory] = await Promise.all([
    dashboardService.getStatHistory(userId, "streak"),
    dashboardService.getStatHistory(userId, "xp"),
    dashboardService.getStatHistory(userId, "trust"),
  ]);

  return {
    streakHistory,
    xpHistory,
    trustHistory,
  };
}

export async function getLeaderboardOrchestrator(window: "weekly" | "all_time", limit: number) {
  const items = await dashboardService.getLeaderboard(window, limit);
  return { items };
}
