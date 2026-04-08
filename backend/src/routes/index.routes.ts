import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.ts";
import { getHealthController } from "../controllers/health.controller.ts";
import { createUserController, getMeController, patchMeController } from "../controllers/user.controller.ts";
import { getOnboardingMeController, putOnboardingMeController } from "../controllers/onboarding.controller.ts";
import {
  getQuestCatalogController,
  getWeeklyHistoryController,
  getWeeklyQuestsController,
  postWeeklyRerollController,
  submitProofController,
} from "../controllers/quest.controller.ts";
import {
  castVoteController,
  getAssignmentsController,
  getVerificationJobController,
} from "../controllers/verification.controller.ts";
import {
  getDashboardController,
  getLeaderboardController,
  getUserStatsController,
} from "../controllers/dashboard.controller.ts";
import { uploadProofPhotoController } from "../controllers/upload.controller.ts";
import {
  getNotificationsMeController,
  patchNotificationReadController,
} from "../controllers/notification.controller.ts";

const app = new Hono();

app.get("/health", getHealthController);

app.use("/api/*", requireAuth);

app.post("/api/users", createUserController);
app.get("/api/users/me", getMeController);
app.patch("/api/users/me", patchMeController);

app.get("/api/onboarding/me", getOnboardingMeController);
app.put("/api/onboarding/me", putOnboardingMeController);

app.get("/api/quests/catalog", getQuestCatalogController);
app.get("/api/quests/weekly/:userId", getWeeklyQuestsController);
app.post("/api/quests/weekly/:userId/reroll", postWeeklyRerollController);
app.get("/api/quests/weekly/:userId/history", getWeeklyHistoryController);
app.post("/api/quests/weekly/:weeklyQuestId/proof", submitProofController);

app.post("/api/uploads/proof-photo", uploadProofPhotoController);

app.get("/api/verification/assignments/:voterUserId", getAssignmentsController);
app.post("/api/verification/jobs/:jobId/vote", castVoteController);
app.get("/api/verification/jobs/:jobId", getVerificationJobController);

app.get("/api/dashboard/:userId", getDashboardController);
app.get("/api/users/:userId/stats", getUserStatsController);

app.get("/api/leaderboard", getLeaderboardController);
app.get("/api/notifications/me", getNotificationsMeController);
app.patch("/api/notifications/:id/read", patchNotificationReadController);

export { app };
