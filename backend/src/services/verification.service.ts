import {
  castVoteRepo,
  createAssignmentsRepo,
  createVerificationJobRepo,
  ensureVoterAssignmentRepo,
  finalizeJobRepo,
  getAssignmentsRepo,
  getJobRepo,
  listCastVotesRepo,
  recomputeJobTallyRepo,
  updateUserTrustScoreRepo,
} from "../repositories/verification.repo.ts";

export const verificationService = {
  createVerificationJob: createVerificationJobRepo,
  createAssignments: createAssignmentsRepo,
  getAssignments: getAssignmentsRepo,
  getJob: getJobRepo,
  ensureVoterAssignment: ensureVoterAssignmentRepo,
  castVote: castVoteRepo,
  recomputeJobTally: recomputeJobTallyRepo,
  finalizeJob: finalizeJobRepo,
  listCastVotes: listCastVotesRepo,
  updateUserTrustScore: updateUserTrustScoreRepo,
};
