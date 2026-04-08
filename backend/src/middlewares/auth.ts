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
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }

  const clerkUserId =
    c.req.header("x-clerk-user-id")?.trim() ||
    c.req.header("x-user-id")?.trim() ||
    process.env.DEV_AUTH_USER_ID?.trim();

  if (!clerkUserId) {
    return c.json(
      {
        data: null,
        error: {
          code: "UNAUTHENTICATED",
          message: "Missing auth header. Send x-clerk-user-id (or x-user-id for local dev).",
        },
      },
      401,
    );
  }

  c.set("auth", { clerkUserId });
  await next();
}
