import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { WeeklyQuest } from "@/lib/models/WeeklyQuest";
import { QuestCatalog } from "@/lib/models/QuestCatalog";
import { VerificationJob } from "@/lib/models/VerificationJob";
import { serializeUser, serializeWeeklyQuest } from "@/lib/serializers";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/server-auth";
import { getWeekStart } from "@/lib/week";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { userId } = await params;

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    if (user._id.toString() !== userId && authUser.userId !== userId) {
      return forbiddenResponse();
    }

    const weekStart = getWeekStart();
    const weeklyQuestsRaw = await WeeklyQuest.find({ userId, weekStart }).lean();

    const questIds = weeklyQuestsRaw.map((q) => q.questId);
    const catalogItems = await QuestCatalog.find({ _id: { $in: questIds } }).lean();
    const catalogMap = new Map(catalogItems.map((c) => [c._id.toString(), c]));

    const weeklyQuests = weeklyQuestsRaw.map((wq) =>
      serializeWeeklyQuest({
        ...wq,
        quest: catalogMap.get(wq.questId.toString()),
      } as never)
    );

    const rerollUsed = weeklyQuestsRaw.some((q) => q.rerollUsed);

    const pendingVerification = await VerificationJob.countDocuments({
      assignedVoterIds: userId,
      status: "pending",
      "votes.voterUserId": { $ne: userId },
    });

    return Response.json({
      user: serializeUser(user),
      weekly: { weekStart, quests: weeklyQuests, rerollUsed },
      pendingVerification,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
