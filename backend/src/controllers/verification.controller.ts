import type { Context } from "hono";

import * as verificationOrchestrator from "../orchestrators/verification.orchestrator.ts";
import { validateJobIdParam, validateVoteInput, validateVoterUserIdParam } from "../vali/verification.vali.ts";

export const castVoteController = async (c: Context) => {
  const jobId = validateJobIdParam(c.req.param("jobId") ?? "");
  const payload = await c.req.json();
  const { voterUserId, vote } = validateVoteInput(payload);

  const result = await verificationOrchestrator.castVerificationVote(jobId, voterUserId, vote);
  return c.json(result);
};

export const listAssignmentsForVoterController = async (c: Context) => {
  const voterUserId = validateVoterUserIdParam(c.req.param("voterUserId") ?? "");
  const result = await verificationOrchestrator.listAssignmentsForVoter(voterUserId);
  return c.json(result);
};
