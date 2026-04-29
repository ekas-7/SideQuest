import { auth } from "@clerk/nextjs/server";

export interface AuthResult {
  userId: string;
}

/**
 * Extracts and verifies the Clerk userId from the current request context.
 * Returns null if the request is unauthenticated.
 */
export async function getAuthUser(): Promise<AuthResult | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return { userId };
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function notFoundResponse(resource = "Resource") {
  return Response.json({ error: `${resource} not found` }, { status: 404 });
}

export function badRequestResponse(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function conflictResponse(message: string) {
  return Response.json({ error: message }, { status: 409 });
}

export function serverErrorResponse(err?: unknown) {
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[API Error]", err);
  return Response.json({ error: message }, { status: 500 });
}
