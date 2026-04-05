import type { Context } from "hono";

import { validateCreateUserInput } from "../vali/user.vali.ts";
import * as userOrchestrator from "../orchestrators/user.orchestrator.ts";

export const createUserController = async (c: Context) => {
  const payload = await c.req.json();
  const { username } = validateCreateUserInput(payload);
  const user = await userOrchestrator.registerUser(username);
  return c.json({ user }, 201);
};
