import { asString } from "./common.vali.ts";

export async function validateCreateUser(body: unknown) {
  const source = (body ?? {}) as Record<string, unknown>;
  const username = asString(source.username, "username", { min: 3, max: 20 });
  return { username: username.toLowerCase() };
}

export async function validateUpdateMe(body: unknown) {
  const source = (body ?? {}) as Record<string, unknown>;
  const username = asString(source.username, "username", { min: 3, max: 20, optional: true });
  return { username: username?.toLowerCase() };
}
