import { HttpError } from "../utils/http.ts";

export function validateLeaderboardQuery(query: Record<string, string | undefined>) {
  const windowRaw = query.window ?? "weekly";
  if (windowRaw !== "weekly" && windowRaw !== "all_time") {
    throw new HttpError(400, "VALIDATION_ERROR", "window must be weekly or all_time");
  }

  const limit = query.limit ? Number.parseInt(query.limit, 10) : 50;
  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    throw new HttpError(400, "VALIDATION_ERROR", "limit must be 1-100");
  }

  return { window: windowRaw as "weekly" | "all_time", limit };
}
