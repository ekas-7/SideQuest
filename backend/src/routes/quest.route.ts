import { Hono } from "hono";

import {
  getWeeklyQuestsController,
  listCatalogController,
  rerollWeeklyQuestsController,
  submitProofController,
} from "../controllers/quest.controller.ts";

export const questRoutes = new Hono();

questRoutes.get("/catalog", listCatalogController);
questRoutes.get("/weekly/:userId", getWeeklyQuestsController);
questRoutes.post("/weekly/:userId/reroll", rerollWeeklyQuestsController);
questRoutes.post("/weekly/:weeklyQuestId/proof", submitProofController);
