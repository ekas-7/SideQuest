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
  serverErrorResponse,
} from "@/lib/server-auth";
import { getWeekStart } from "@/lib/week";

export const dynamic = "force-dynamic";

async function assignWeeklyQuests(userId: string, weekStart: string) {
  const catalog = await QuestCatalog.find({}).lean();
  if (catalog.length === 0) return [];

  const slotsNeeded = 3;
  const shuffled = catalog.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(slotsNeeded, shuffled.length));

  const docs = await WeeklyQuest.insertMany(
    picked.map((q, i) => ({
      userId,
      questId: q._id,
      weekStart,
      slot: i,
      status: "assigned",
    }))
  );
  return docs;
}

export async function GET(
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

    let quests = await WeeklyQuest.find({ userId, weekStart }).lean();

    if (quests.length === 0) {
      quests = await assignWeeklyQuests(userId, weekStart);
    }

    const questIds = quests.map((q) => q.questId);
    const catalogItems = await QuestCatalog.find({ _id: { $in: questIds } }).lean();
    const catalogMap = new Map(catalogItems.map((c) => [c._id.toString(), c]));

    const serialized = quests.map((wq) => ({
      ...serializeWeeklyQuest(wq as never),
      quest: catalogMap.get(wq.questId.toString())
        ? serializeWeeklyQuest({
            ...wq,
            quest: catalogMap.get(wq.questId.toString()),
          } as never).quest
        : null,
    }));

    const rerollUsed = quests.some((q) => q.rerollUsed);

    return Response.json({ weekStart, quests: serialized, rerollUsed });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
