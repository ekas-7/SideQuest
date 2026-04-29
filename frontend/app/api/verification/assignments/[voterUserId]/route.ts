import { connectToDatabase } from "@/lib/mongodb";
import { VerificationJob } from "@/lib/models/VerificationJob";
import { WeeklyQuest } from "@/lib/models/WeeklyQuest";
import { QuestCatalog } from "@/lib/models/QuestCatalog";
import { User } from "@/lib/models/User";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/server-auth";
import { serializeVerificationJob } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ voterUserId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { voterUserId } = await params;

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    if (user._id.toString() !== voterUserId && authUser.userId !== voterUserId) {
      return forbiddenResponse();
    }

    const jobs = await VerificationJob.find({
      assignedVoterIds: voterUserId,
      status: "pending",
      "votes.voterUserId": { $ne: voterUserId },
    }).lean();

    const weeklyQuestIds = jobs.map((j) => j.weeklyQuestId);
    const weeklyQuests = await WeeklyQuest.find({
      _id: { $in: weeklyQuestIds },
    }).lean();
    const questIds = weeklyQuests.map((wq) => wq.questId);
    const catalogItems = await QuestCatalog.find({ _id: { $in: questIds } }).lean();

    const wqMap = new Map(weeklyQuests.map((wq) => [wq._id.toString(), wq]));
    const catalogMap = new Map(
      catalogItems.map((c) => [c._id.toString(), c])
    );

    const assignments = jobs.map((job) => {
      const wq = wqMap.get(job.weeklyQuestId.toString());
      const quest = wq ? catalogMap.get(wq.questId.toString()) : null;
      return {
        ...serializeVerificationJob(job as never),
        weeklyQuest: wq
          ? {
              id: wq._id.toString(),
              userId: wq.userId,
              weekStart: wq.weekStart,
              slot: wq.slot,
            }
          : null,
        quest: quest
          ? {
              id: quest._id.toString(),
              title: quest.title,
              description: quest.description,
              toughness: quest.toughness,
              statFocus: quest.statFocus,
            }
          : null,
      };
    });

    return Response.json({ assignments });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
