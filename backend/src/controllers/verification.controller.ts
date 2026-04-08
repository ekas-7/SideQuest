import type { Context } from "hono";
import {
  castVoteOrchestrator,
  getAssignmentsOrchestrator,
  getVerificationJobOrchestrator,
} from "../orchestrators/verification.orchestrator.ts";
import { fail, ok } from "../utils/http.ts";
import { requireParam } from "../vali/common.vali.ts";
import { validateCastVote, validateJobId } from "../vali/verification.vali.ts";

export async function getAssignmentsController(c: Context) {
  try {
  const voterUserId = requireParam(c.req.param("voterUserId"), "voterUserId");
    const data = await getAssignmentsOrchestrator(voterUserId);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function castVoteController(c: Context) {
  try {
  const jobId = validateJobId(requireParam(c.req.param("jobId"), "jobId"));
    const body = await c.req.json();
    const payload = await validateCastVote(body);
    const data = await castVoteOrchestrator(jobId, payload.voterUserId, payload.vote);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}

export async function getVerificationJobController(c: Context) {
  try {
  const jobId = validateJobId(requireParam(c.req.param("jobId"), "jobId"));
    const data = await getVerificationJobOrchestrator(jobId);
    return c.json(ok(data));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}
