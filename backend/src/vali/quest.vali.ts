import { HttpError } from "../utils/http-error.ts";

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const validateUserIdParam = (userId: string | undefined): string => {
  const normalized = (userId ?? "").trim();
  if (!normalized) {
    throw new HttpError(400, "userId is required.");
  }
  return normalized;
};

export const validateDateQuery = (date: string | undefined): Date | undefined => {
  if (!date) {
    return undefined;
  }
  if (!isIsoDate(date)) {
    throw new HttpError(400, "date must use YYYY-MM-DD format.");
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "Invalid date supplied.");
  }

  return parsed;
};

export const validateProofSubmissionInput = (
  payload: unknown,
): { userId: string; description: string; proofUrl: string } => {
  const body = payload as Record<string, unknown>;

  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const proofUrl = typeof body?.proofUrl === "string" ? body.proofUrl.trim() : "";

  if (!userId) {
    throw new HttpError(400, "userId is required.");
  }
  if (!description) {
    throw new HttpError(400, "description is required.");
  }
  if (!proofUrl) {
    throw new HttpError(400, "proofUrl is required.");
  }

  return { userId, description, proofUrl };
};

export const validateWeeklyQuestIdParam = (weeklyQuestId: string | undefined): number => {
  const parsed = Number(weeklyQuestId ?? "");
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "weeklyQuestId must be a positive integer.");
  }

  return parsed;
};
