import type { Context } from "hono";

import * as questOrchestrator from "../orchestrators/quest.orchestrator.ts";
import {
  validateDateQuery,
  validateProofSubmissionInput,
  validateUserIdParam,
  validateWeeklyQuestIdParam,
} from "../vali/quest.vali.ts";
import * as questService from "../services/quest.service.ts";

export const getWeeklyQuestsController = async (c: Context) => {
  const userId = validateUserIdParam(c.req.param("userId"));
  const date = validateDateQuery(c.req.query("date"));

  const result = await questOrchestrator.getOrAssignWeeklyQuests(userId, date);
  return c.json(result);
};

export const rerollWeeklyQuestsController = async (c: Context) => {
  const userId = validateUserIdParam(c.req.param("userId"));
  const date = validateDateQuery(c.req.query("date"));

  const result = await questOrchestrator.rerollWeeklyQuests(userId, date);
  return c.json(result);
};

export const submitProofController = async (c: Context) => {
  const weeklyQuestId = validateWeeklyQuestIdParam(c.req.param("weeklyQuestId"));
  const payload = await c.req.json();
  const { userId, description, proofUrl } = validateProofSubmissionInput(payload);

  const result = await questOrchestrator.submitQuestProof(weeklyQuestId, userId, description, proofUrl);
  return c.json(result, 202);
};

export const listCatalogController = async (c: Context) => {
  const catalog = await questService.listAllCatalogItems();
  return c.json({ catalog });
};
