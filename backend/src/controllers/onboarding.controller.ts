import type { Context } from "hono";
import { getAuth } from "../middlewares/auth.ts";
import { getOnboardingOrchestrator, upsertOnboardingOrchestrator } from "../orchestrators/onboarding.orchestrator.ts";
import { fail, ok } from "../utils/http.ts";
import { validateOnboardingUpdate } from "../vali/onboarding.vali.ts";

export async function getOnboardingMeController(c: Context) {
  try {
    const { clerkUserId } = getAuth(c);
    const data = await getOnboardingOrchestrator(clerkUserId);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
  return c.json(e.body, e.status as never);
  }
}

export async function putOnboardingMeController(c: Context) {
  try {
    const { clerkUserId } = getAuth(c);
    const body = await c.req.json();
    const payload = await validateOnboardingUpdate(body);
    const data = await upsertOnboardingOrchestrator(clerkUserId, payload.interests);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}
