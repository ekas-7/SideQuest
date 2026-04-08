import type { Context } from "hono";
import {
  getDashboardOrchestrator,
  getLeaderboardOrchestrator,
  getUserStatsOrchestrator,
} from "../orchestrators/dashboard.orchestrator.ts";
import { fail, ok } from "../utils/http.ts";
import { requireParam } from "../vali/common.vali.ts";
import { validateLeaderboardQuery } from "../vali/dashboard.vali.ts";

export async function getDashboardController(c: Context) {
  try {
  const userId = requireParam(c.req.param("userId"), "userId");
    const data = await getDashboardOrchestrator(userId);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function getUserStatsController(c: Context) {
  try {
  const userId = requireParam(c.req.param("userId"), "userId");
    const data = await getUserStatsOrchestrator(userId);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function getLeaderboardController(c: Context) {
  try {
    const query = validateLeaderboardQuery({
      window: c.req.query("window"),
      limit: c.req.query("limit"),
    });
    const data = await getLeaderboardOrchestrator(query.window, query.limit);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}
