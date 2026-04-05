import { runInTransaction } from "../config/database.ts";
import { HttpError } from "../utils/http-error.ts";
import { tallyVotes } from "../utils/voting.ts";
import * as verificationService from "../services/verification.service.ts";
import * as questService from "../services/quest.service.ts";
import * as userService from "../services/user.service.ts";

export const castVerificationVote = async (jobId: number, voterUserId: string, vote: boolean) => {
  return runInTransaction(async (client) => {
    const job = await verificationService.getJobById(jobId, client);
    if (!job) {
      throw new HttpError(404, "Verification job not found.");
    }

    if (job.status !== "pending") {
      throw new HttpError(409, "This verification job has already been decided.");
    }

    const assignment = await verificationService.getAssignmentForVoter(jobId, voterUserId, client);
    if (!assignment) {
      throw new HttpError(403, "You are not assigned to this verification job.");
    }

    if (assignment.respondedAt) {
      throw new HttpError(409, "You have already voted for this job.");
    }

    await verificationService.recordVote(assignment.id, vote, client);

    const votes = await verificationService.listRespondedVotes(jobId, job.requiredVotes, client);
    if (votes.length < job.requiredVotes) {
      return {
        jobId,
        status: "pending" as const,
        votesCollected: votes.length,
        votesRequired: job.requiredVotes,
      };
    }

    const tally = tallyVotes(votes.map((entry) => entry.vote));
    const approved = tally.majorityVote;

    await verificationService.decideJob(jobId, approved, client);
    await questService.decideWeeklyQuest(job.weeklySideQuestId, approved, client);

    const quest = await questService.getWeeklyQuestById(job.weeklySideQuestId, client);
    if (!quest) {
      throw new HttpError(404, "Associated weekly quest not found.");
    }

    if (approved) {
      const xpGain = quest.quest.toughness * 100;
      const statGain = quest.quest.toughness;
      await userService.applyProgressForVerifiedQuest(quest.userId, xpGain, quest.quest.statFocus, statGain, client);
    }

    for (const castVote of votes) {
      const delta = castVote.vote === approved ? 1 : -1;
      await userService.applyTrustDelta(castVote.voterUserId, delta, client);
    }

    await verificationService.markTrustApplied(
      votes.map((entry) => entry.assignmentId),
      client,
    );

    return {
      jobId,
      status: approved ? "approved" : "rejected",
      approvals: tally.approvals,
      rejections: tally.rejections,
      majorityVote: tally.majorityVote,
      votesUsed: votes.length,
    };
  });
};

export const listAssignmentsForVoter = async (voterUserId: string) => {
  const assignments = await verificationService.listAssignmentsForVoter(voterUserId);
  return { assignments };
};
