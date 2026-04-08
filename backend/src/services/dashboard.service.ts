import {
  getLeaderboardRepo,
  getPendingVerificationCountRepo,
  getStatHistoryRepo,
  upsertStatHistoryRepo,
} from "../repositories/dashboard.repo.ts";

export const dashboardService = {
  getPendingVerificationCount: getPendingVerificationCountRepo,
  upsertStatHistory: upsertStatHistoryRepo,
  getStatHistory: getStatHistoryRepo,
  getLeaderboard: getLeaderboardRepo,
};
