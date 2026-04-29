import { connectToDatabase } from "@/lib/mongodb";
import { StatsHistory } from "@/lib/models/StatsHistory";
import { User } from "@/lib/models/User";
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { userId } = await params;

    await connectToDatabase();

    const targetUser = await User.findById(userId).lean();
    if (!targetUser) return notFoundResponse("User");

    const history = await StatsHistory.find({ userId })
      .sort({ date: 1 })
      .limit(90)
      .lean();

    return Response.json({
      streakHistory: history.map((h) => ({ date: h.date, value: h.streak })),
      xpHistory: history.map((h) => ({ date: h.date, value: h.xp })),
      trustHistory: history.map((h) => ({ date: h.date, value: h.trustScore })),
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
