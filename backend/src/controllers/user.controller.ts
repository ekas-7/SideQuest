import type { Context } from "hono";
import { getMeOrchestrator, updateMeOrchestrator, createUserOrchestrator } from "../orchestrators/user.orchestrator.ts";
import { getAuth } from "../middlewares/auth.ts";
import { fail, ok } from "../utils/http.ts";
import { validateCreateUser, validateUpdateMe } from "../vali/user.vali.ts";

export async function createUserController(c: Context) {
  try {
    const { clerkUserId } = getAuth(c);
    const body = await c.req.json();
    const payload = await validateCreateUser(body);
    const user = await createUserOrchestrator(clerkUserId, payload.username);
    return c.json(ok({ user }), 201);
  } catch (error) {
    const e = fail(error);
  return c.json(e.body, e.status as never);
  }
}

export async function getMeController(c: Context) {
  try {
    const { clerkUserId } = getAuth(c);
    const user = await getMeOrchestrator(clerkUserId);
    return c.json(ok({ user }), 200);
  } catch (error) {
    const e = fail(error);
  return c.json(e.body, e.status as never);
  }
}

export async function patchMeController(c: Context) {
  try {
    const { clerkUserId } = getAuth(c);
    const body = await c.req.json();
    const payload = await validateUpdateMe(body);
    const user = await updateMeOrchestrator(clerkUserId, payload.username);
    return c.json(ok({ user }), 200);
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}
