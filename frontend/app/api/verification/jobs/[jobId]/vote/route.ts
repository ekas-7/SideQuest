import { connectToDatabase } from "@/lib/mongodb";
import { VerificationJob } from "@/lib/models/VerificationJob";
import { WeeklyQuest } from "@/lib/models/WeeklyQuest";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import { StatsHistory } from "@/lib/models/StatsHistory";
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  conflictResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const TRUST_SCORE_DELTA = 10;

async function recordStatsSnapshot(userId: string) {
  const user = await User.findOne({ _id: userId });
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  await StatsHistory.findOneAndUpdate(
    { userId, date: today },
    { streak: user.streak, xp: user.xp, trustScore: user.trustScore },
    { upsert: true }
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { jobId } = await params;

    const body = await request.json();
    const { voterUserId, vote } = body as {
      voterUserId?: string;
      vote?: boolean;
    };

    if (!voterUserId || vote === undefined || typeof vote !== "boolean") {
      return badRequestResponse("voterUserId and vote (boolean) are required");
    }

    await connectToDatabase();

    const voter = await User.findOne({ clerkId: authUser.userId });
    if (!voter) return notFoundResponse("Voter user");

    const job = await VerificationJob.findById(jobId);
    if (!job) return notFoundResponse("Verification job");

    if (job.status !== "pending") {
      return conflictResponse(`Job already finalized: ${job.status}`);
    }

    const alreadyVoted = job.votes.some((v) => v.voterUserId === voterUserId);
    if (alreadyVoted) return conflictResponse("Already voted on this job");

    if (!job.assignedVoterIds.includes(voterUserId)) {
      return badRequestResponse("You are not assigned to this verification job");
    }

    job.votes.push({ voterUserId, vote, votedAt: new Date() });
    if (vote) {
      job.approvals += 1;
    } else {
      job.rejections += 1;
    }

    const totalVotes = job.approvals + job.rejections;
    let finalized = false;

    if (job.approvals >= job.requiredVotes) {
      job.status = "approved";
      finalized = true;

      const weeklyQuest = await WeeklyQuest.findById(job.weeklyQuestId);
      if (weeklyQuest) {
        weeklyQuest.status = "verified";
        weeklyQuest.verifiedAt = new Date();
        await weeklyQuest.save();

        const submitter = await User.findOne({ _id: weeklyQuest.userId });
        if (submitter) {
          submitter.trustScore += TRUST_SCORE_DELTA;
          submitter.streak += 1;
          await submitter.save();
          await recordStatsSnapshot(submitter._id.toString());

          await Notification.create({
            userId: weeklyQuest.userId,
            type: "proof_approved",
            title: "Quest Verified!",
            message: `Your quest proof was approved by the community. +${TRUST_SCORE_DELTA} trust score!`,
            metadata: { jobId, weeklyQuestId: weeklyQuest._id.toString() },
          });
        }
      }
    } else if (job.rejections >= job.requiredVotes || totalVotes >= job.requiredVotes * 2) {
      job.status = "rejected";
      finalized = true;

      const weeklyQuest = await WeeklyQuest.findById(job.weeklyQuestId);
      if (weeklyQuest) {
        weeklyQuest.status = "rejected";
        await weeklyQuest.save();

        await Notification.create({
          userId: weeklyQuest.userId,
          type: "proof_rejected",
          title: "Quest Rejected",
          message: "Your quest proof was rejected by the community. Try again!",
          metadata: { jobId, weeklyQuestId: weeklyQuest._id.toString() },
        });
      }
    }

    await job.save();

    if (finalized) {
      return Response.json({
        status: job.status,
        approvals: job.approvals,
        rejections: job.rejections,
        requiredVotes: job.requiredVotes,
        finalized: true,
      });
    }

    return Response.json({
      status: "pending",
      approvals: job.approvals,
      rejections: job.rejections,
      requiredVotes: job.requiredVotes,
      finalized: false,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
