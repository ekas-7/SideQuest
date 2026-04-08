import { HttpError } from "../utils/http.ts";

export async function validateOnboardingUpdate(body: unknown) {
  const source = (body ?? {}) as Record<string, unknown>;
  const interests = source.interests;

  if (!Array.isArray(interests)) {
    throw new HttpError(400, "VALIDATION_ERROR", "interests must be an array of strings");
  }

  const parsed = interests.map((item) => String(item).trim()).filter(Boolean).slice(0, 10);
  return { interests: parsed };
}
