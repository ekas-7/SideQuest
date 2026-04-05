import { HttpError } from "../utils/http-error.ts";

export const validateJobIdParam = (jobId: string): number => {
  const parsed = Number(jobId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "jobId must be a positive integer.");
  }

  return parsed;
};

export const validateVoteInput = (payload: unknown): { voterUserId: string; vote: boolean } => {
  const body = payload as Record<string, unknown>;

  const voterUserId = typeof body?.voterUserId === "string" ? body.voterUserId.trim() : "";
  const voteValue = body?.vote;

  if (!voterUserId) {
    throw new HttpError(400, "voterUserId is required.");
  }

  if (typeof voteValue !== "boolean") {
    throw new HttpError(400, "vote must be a boolean.");
  }

  return {
    voterUserId,
    vote: voteValue,
  };
};

export const validateVoterUserIdParam = (voterUserId: string): string => {
  const normalized = voterUserId.trim();
  if (!normalized) {
    throw new HttpError(400, "voterUserId is required.");
  }
  return normalized;
};
