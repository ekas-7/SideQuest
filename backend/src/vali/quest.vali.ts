import { HttpError } from "../utils/http.ts";
import { asIntParam, asString } from "./common.vali.ts";

export function validateWeeklyQuery(query: Record<string, string | undefined>) {
  const date = query.date?.trim();
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, "VALIDATION_ERROR", "date must be YYYY-MM-DD");
  }
  return { date };
}

export function validateHistoryQuery(query: Record<string, string | undefined>) {
  const limit = query.limit ? Number.parseInt(query.limit, 10) : 20;
  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    throw new HttpError(400, "VALIDATION_ERROR", "limit must be 1-100");
  }

  const cursor = query.cursor ? Number.parseInt(query.cursor, 10) : undefined;
  if (query.cursor && Number.isNaN(cursor)) {
    throw new HttpError(400, "VALIDATION_ERROR", "cursor must be an integer");
  }

  return { limit, cursor };
}

export async function validateSubmitProof(body: unknown) {
  const source = (body ?? {}) as Record<string, unknown>;

  return {
    userId: asString(source.userId, "userId", { min: 1, max: 100 }),
    description: asString(source.description, "description", { min: 5, max: 500 }),
    proofUrl: asString(source.proofUrl, "proofUrl", { min: 8, max: 2000 }),
  };
}

export function validateWeeklyQuestId(param: string) {
  return asIntParam(param, "weeklyQuestId");
}
