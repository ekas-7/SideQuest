import { runInTransaction } from "../config/database.ts";
import type { CastVoteResponse } from "../models/types.ts";
import { dashboardService } from "../services/dashboard.service.ts";
import { questService } from "../services/quest.service.ts";
import { userService } from "../services/user.service.ts";
import { verificationService } from "../services/verification.service.ts";
import { HttpError } from "../utils/http.ts";

function decideJobStatus(approvals: number, rejections: number, requiredVotes: number): "approved" | "rejected" | null {
  if (approvals >= 3) return "approved";
  if (rejections >= 3) return "rejected";
  const total = approvals + rejections;
  if (total < requiredVotes) return null;
  return approvals >= rejections ? "approved" : "rejected";
}

export async function getAssignmentsOrchestrator(voterUserId: string) {
  const user = await userService.getById(voterUserId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "Voter user not found");

  const assignments = await verificationService.getAssignments(voterUserId);
  return { assignments };
}

export async function castVoteOrchestrator(jobId: number, voterUserId: string, vote: boolean): Promise<CastVoteResponse> {
  return runInTransaction(async (client) => {
    const job = await verificationService.getJob(jobId, client);
    if (!job) throw new HttpError(404, "JOB_NOT_FOUND", "Verification job not found");
    if (job.status !== "pending") {
      throw new HttpError(409, "JOB_ALREADY_FINALIZED", "Verification job is already finalized");
    }

    const hasAssignment = await verificationService.ensureVoterAssignment(jobId, voterUserId, client);
    if (!hasAssignment) {
      throw new HttpError(403, "NO_ASSIGNMENT", "User is not eligible to vote this job");
    }

    await verificationService.castVote(jobId, voterUserId, vote, client);
    const tally = await verificationService.recomputeJobTally(jobId, client);

    const finalStatus = decideJobStatus(tally.approvals, tally.rejections, tally.required_votes);
    if (!finalStatus) {
      return {
        status: "pending",
        jobId,
        approvals: tally.approvals,
        rejections: tally.rejections,
        requiredVotes: tally.required_votes,
      };
    }

    await verificationService.finalizeJob(jobId, finalStatus, client);

    const weeklyQuest = await questService.getWeeklyQuestById(tally.weekly_quest_id, client);
    if (!weeklyQuest) throw new HttpError(404, "WEEKLY_QUEST_NOT_FOUND", "Weekly quest not found");

    if (finalStatus === "approved") {
      await questService.markQuestVerified(tally.weekly_quest_id, client);
      const owner = await userService.getById(weeklyQuest.userId, client);
      if (owner) {
        const xpGain = weeklyQuest.quest.toughness * 100;
        const statGain = weeklyQuest.quest.toughness;

        await runRewardUpdate(owner.id, xpGain, statGain, weeklyQuest.quest.statFocus, client);
      }
    } else {
      await questService.markQuestRejected(tally.weekly_quest_id, client);
    }

    const castVotes = await verificationService.listCastVotes(jobId, client);
    for (const cast of castVotes) {
      const delta = cast.vote === (finalStatus === "approved") ? 1 : -1;
      await verificationService.updateUserTrustScore(cast.voterUserId, delta, client);
    }

    return {
      status: finalStatus,
      jobId,
      approvals: tally.approvals,
      rejections: tally.rejections,
      requiredVotes: tally.required_votes,
    };
  });
}

async function runRewardUpdate(
  userId: string,
  xpGain: number,
  statGain: number,
  statFocus: "strength" | "agility" | "intelligence",
  client: Parameters<typeof userService.getById>[1],
) {
  const user = await userService.getById(userId, client);
  if (!user) return;

  const next = {
    streak: user.streak + 1,
    xp: user.xp + xpGain,
    strength: user.strength,
    agility: user.agility,
    intelligence: user.intelligence,
  };

  next[statFocus] += statGain;

  await import("../config/database.ts").then(({ query }) =>
    query(
      `
        UPDATE users
        SET streak = $2,
            xp = $3,
            strength = $4,
            agility = $5,
            intelligence = $6
        WHERE id = $1
      `,
      [userId, next.streak, next.xp, next.strength, next.agility, next.intelligence],
      client,
    ),
  );

  await dashboardService.upsertStatHistory(userId, "streak", next.streak, client);
  await dashboardService.upsertStatHistory(userId, "xp", next.xp, client);
}

export async function getVerificationJobOrchestrator(jobId: number) {
  const job = await verificationService.getJob(jobId);
  if (!job) throw new HttpError(404, "JOB_NOT_FOUND", "Verification job not found");

  return {
    job: {
      id: job.id,
      status: job.status,
      approvals: job.approvals,
      rejections: job.rejections,
      requiredVotes: job.required_votes,
    },
  };
}
