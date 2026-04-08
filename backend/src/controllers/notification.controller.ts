import type { Context } from "hono";
import { getAuth } from "../middlewares/auth.ts";
import {
  getNotificationsOrchestrator,
  markNotificationReadOrchestrator,
} from "../orchestrators/notification.orchestrator.ts";
import { fail, ok } from "../utils/http.ts";
import { requireParam } from "../vali/common.vali.ts";
import { validateNotificationId } from "../vali/notification.vali.ts";

export async function getNotificationsMeController(c: Context) {
  try {
    const { clerkUserId } = getAuth(c);
    const data = await getNotificationsOrchestrator(clerkUserId);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function patchNotificationReadController(c: Context) {
  try {
    const { clerkUserId } = getAuth(c);
  const notificationId = validateNotificationId(requireParam(c.req.param("id"), "id"));
    const data = await markNotificationReadOrchestrator(clerkUserId, notificationId);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}
