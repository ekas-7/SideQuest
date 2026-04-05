import type { QueryExecutor } from "../config/database.ts";
import * as verificationRepo from "../repositories/verification.repo.ts";

export const createJob = (weeklySideQuestId: number, requiredVotes: number, executor?: QueryExecutor) =>
  verificationRepo.createVerificationJob(weeklySideQuestId, requiredVotes, executor);

export const getJobById = (jobId: number, executor?: QueryExecutor) => verificationRepo.getVerificationJobById(jobId, executor);

export const createAssignments = (jobId: number, voterUserIds: string[], executor?: QueryExecutor) =>
  verificationRepo.createVerificationAssignments(jobId, voterUserIds, executor);

export const getAssignmentForVoter = (jobId: number, voterUserId: string, executor?: QueryExecutor) =>
  verificationRepo.getAssignmentForVoter(jobId, voterUserId, executor);

export const recordVote = (assignmentId: number, vote: boolean, executor?: QueryExecutor) =>
  verificationRepo.recordVoteForAssignment(assignmentId, vote, executor);

export const listRespondedVotes = (jobId: number, limit: number, executor?: QueryExecutor) =>
  verificationRepo.listRespondedVotesForJob(jobId, limit, executor);

export const decideJob = (jobId: number, approved: boolean, executor?: QueryExecutor) =>
  verificationRepo.markVerificationJobDecision(jobId, approved, executor);

export const markTrustApplied = (assignmentIds: number[], executor?: QueryExecutor) =>
  verificationRepo.markTrustDeltaAppliedForAssignments(assignmentIds, executor);

export const listAssignmentsForVoter = (voterUserId: string, executor?: QueryExecutor) =>
  verificationRepo.listAssignmentsForVoter(voterUserId, executor);
