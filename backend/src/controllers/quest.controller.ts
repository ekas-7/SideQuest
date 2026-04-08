import type { Context } from "hono";
import {
  getQuestCatalogOrchestrator,
  getWeeklyHistoryOrchestrator,
  getWeeklyQuestsOrchestrator,
  rerollWeeklyQuestsOrchestrator,
  submitProofOrchestrator,
} from "../orchestrators/quest.orchestrator.ts";
import { fail, ok } from "../utils/http.ts";
import {
  validateHistoryQuery,
  validateSubmitProof,
  validateWeeklyQuery,
  validateWeeklyQuestId,
} from "../vali/quest.vali.ts";
import { requireParam } from "../vali/common.vali.ts";

export async function getQuestCatalogController(c: Context) {
  try {
    const catalog = await getQuestCatalogOrchestrator();
    return c.json(ok({ catalog }));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function getWeeklyQuestsController(c: Context) {
  try {
  const userId = requireParam(c.req.param("userId"), "userId");
    const payload = validateWeeklyQuery({ date: c.req.query("date") });
    const data = await getWeeklyQuestsOrchestrator(userId, payload.date);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function postWeeklyRerollController(c: Context) {
  try {
  const userId = requireParam(c.req.param("userId"), "userId");
    const payload = validateWeeklyQuery({ date: c.req.query("date") });
    const data = await rerollWeeklyQuestsOrchestrator(userId, payload.date);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function getWeeklyHistoryController(c: Context) {
  try {
  const userId = requireParam(c.req.param("userId"), "userId");
    const query = validateHistoryQuery({
      limit: c.req.query("limit"),
      cursor: c.req.query("cursor"),
    });
    const data = await getWeeklyHistoryOrchestrator(userId, query.limit, query.cursor);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function submitProofController(c: Context) {
  try {
  const weeklyQuestId = validateWeeklyQuestId(requireParam(c.req.param("weeklyQuestId"), "weeklyQuestId"));
    const body = await c.req.json();
    const payload = await validateSubmitProof(body);
    const data = await submitProofOrchestrator(
      weeklyQuestId,
      payload.userId,
      payload.description,
      payload.proofUrl,
    );
    return c.json(ok(data), 201);
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}
