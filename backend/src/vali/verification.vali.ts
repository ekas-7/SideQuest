import { asBoolean, asIntParam, asString } from "./common.vali.ts";

export function validateJobId(param: string) {
  return asIntParam(param, "jobId");
}

export async function validateCastVote(body: unknown) {
  const source = (body ?? {}) as Record<string, unknown>;
  return {
    voterUserId: asString(source.voterUserId, "voterUserId", { min: 1, max: 100 }),
    vote: asBoolean(source.vote, "vote"),
  };
}
