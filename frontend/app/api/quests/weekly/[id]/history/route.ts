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
  serverErrorResponse,
} from "@/lib/server-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

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

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const cursor = searchParams.get("cursor");

    const filter: Record<string, unknown> = {
      userId,
      status: { $in: ["verified", "rejected", "submitted"] },
    };

    if (cursor) {
      try {
        filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      } catch {
        // ignore invalid cursor
      }
    }

    const items = await WeeklyQuest.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? page[page.length - 1]._id.toString() : null;

    const questIds = page.map((q) => q.questId);
    const catalogItems = await QuestCatalog.find({ _id: { $in: questIds } }).lean();
    const catalogMap = new Map(catalogItems.map((c) => [c._id.toString(), c]));

    const serialized = page.map((wq) =>
      serializeWeeklyQuest({
        ...wq,
        quest: catalogMap.get(wq.questId.toString()),
      } as never)
    );

    return Response.json({ items: serialized, nextCursor });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
