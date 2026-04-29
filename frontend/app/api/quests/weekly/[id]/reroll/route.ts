import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { WeeklyQuest } from "@/lib/models/WeeklyQuest";
import { QuestCatalog } from "@/lib/models/QuestCatalog";
import { User } from "@/lib/models/User";
import { serializeWeeklyQuest } from "@/lib/serializers";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  conflictResponse,
  serverErrorResponse,
} from "@/lib/server-auth";
import { getWeekStart } from "@/lib/week";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { id: userId } = await params;

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    if (user._id.toString() !== userId && authUser.userId !== userId) {
      return forbiddenResponse();
    }

    const dateParam = request.nextUrl.searchParams.get("date") ?? undefined;
    let weekStart: string;
    try {
      weekStart = getWeekStart(dateParam);
    } catch {
      return badRequestResponse("Invalid date parameter");
    }

    const existingQuests = await WeeklyQuest.find({ userId, weekStart });
    if (existingQuests.length === 0) return notFoundResponse("Weekly quests");

    const rerollAlreadyUsed = existingQuests.some((q) => q.rerollUsed);
    if (rerollAlreadyUsed) return conflictResponse("Reroll already used this week");

    const hasSubmitted = existingQuests.some(
      (q) => q.status === "submitted" || q.status === "verified"
    );
    if (hasSubmitted) {
      return conflictResponse("Cannot reroll after submitting proof");
    }

    await WeeklyQuest.deleteMany({ userId, weekStart });

    const catalog = await QuestCatalog.find({}).lean();
    const shuffled = catalog.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(3, shuffled.length));

    const newQuests = await WeeklyQuest.insertMany(
      picked.map((q, i) => ({
        userId,
        questId: q._id,
        weekStart,
        slot: i,
        status: "assigned",
        rerollUsed: true,
      }))
    );

    const questIds = newQuests.map((q) => q.questId);
    const catalogItems = await QuestCatalog.find({ _id: { $in: questIds } }).lean();
    const catalogMap = new Map(catalogItems.map((c) => [c._id.toString(), c]));

    const serialized = newQuests.map((wq) =>
      serializeWeeklyQuest({
        ...wq.toObject(),
        quest: catalogMap.get(wq.questId.toString()),
      } as never)
    );

    return Response.json({ weekStart, quests: serialized, rerollUsed: true });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
