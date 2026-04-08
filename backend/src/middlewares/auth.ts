import type { Context, Next } from "hono";
import { HttpError } from "../utils/http.ts";

type AuthContext = {
  clerkUserId: string;
};

export function getAuth(c: Context): AuthContext {
  const auth = c.get("auth") as AuthContext | undefined;
  if (!auth) {
    throw new HttpError(401, "UNAUTHENTICATED", "Missing authentication context");
  }
  return auth;
}

export async function requireAuth(c: Context, next: Next) {
  const clerkUserId = c.req.header("x-clerk-user-id")?.trim();
  if (!clerkUserId) {
    throw new HttpError(401, "UNAUTHENTICATED", "Missing x-clerk-user-id header");
  }

  c.set("auth", { clerkUserId });
  await next();
}
