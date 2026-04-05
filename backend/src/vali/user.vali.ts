import { HttpError } from "../utils/http-error.ts";

export const validateCreateUserInput = (payload: unknown): { username: string } => {
  const body = payload as Record<string, unknown>;
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";

  if (!username) {
    throw new HttpError(400, "username is required.");
  }

  if (username.length < 3 || username.length > 32) {
    throw new HttpError(400, "username must be between 3 and 32 characters.");
  }

  return { username };
};
