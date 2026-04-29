import { connectToDatabase } from "@/lib/mongodb";
import { WeeklyQuest } from "@/lib/models/WeeklyQuest";
import { VerificationJob } from "@/lib/models/VerificationJob";
import { User } from "@/lib/models/User";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
} from "@/lib/server-auth";
import { serializeVerificationJob } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const REQUIRED_VOTES = 3;
const XP_PER_QUEST = 50;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { id: weeklyQuestId } = await params;

    const body = await request.json();
    const { userId, description, proofUrl } = body as {
      userId?: string;
      description?: string;
      proofUrl?: string;
    };

    if (!userId || !description || !proofUrl) {
      return badRequestResponse("userId, description, and proofUrl are required");
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    if (user._id.toString() !== userId && authUser.userId !== userId) {
      return forbiddenResponse();
    }

    const weeklyQuest = await WeeklyQuest.findById(weeklyQuestId);
    if (!weeklyQuest) return notFoundResponse("Weekly quest");

    if (weeklyQuest.userId !== userId) return forbiddenResponse();

    if (weeklyQuest.status !== "assigned") {
      return badRequestResponse(
        `Quest is already in status: ${weeklyQuest.status}`
      );
    }

    weeklyQuest.status = "submitted";
    weeklyQuest.proofDescription = description;
    weeklyQuest.proofUrl = proofUrl;
    weeklyQuest.submittedAt = new Date();
    await weeklyQuest.save();

    const potentialVoters = await User.find({
      _id: { $ne: user._id },
      clerkId: { $ne: authUser.userId },
    })
      .select("_id")
      .limit(REQUIRED_VOTES * 3)
      .lean();

    const shuffled = potentialVoters.sort(() => Math.random() - 0.5);
    const assignedVoterIds = shuffled
      .slice(0, REQUIRED_VOTES)
      .map((u) => u._id.toString());

    const job = await VerificationJob.create({
      weeklyQuestId,
      submitterUserId: userId,
      status: "pending",
      approvals: 0,
      rejections: 0,
      requiredVotes: REQUIRED_VOTES,
      assignedVoterIds,
      proofUrl,
      proofDescription: description,
    });

    user.xp += XP_PER_QUEST;
    await user.save();

    return Response.json(
      {
        weeklyQuestId,
        job: serializeVerificationJob(job),
        status: "pending",
      },
      { status: 201 }
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}
