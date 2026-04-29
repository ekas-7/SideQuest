import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const window = searchParams.get("window") ?? "all_time";
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

    const sortField =
      window === "weekly" ? { xp: -1 as const } : { xp: -1 as const };

    const users = await User.find({})
      .sort(sortField)
      .limit(limit)
      .select("username xp trustScore streak")
      .lean();

    const entries = users.map((u, index) => ({
      rank: index + 1,
      userId: u._id.toString(),
      username: u.username,
      xp: u.xp,
      trustScore: u.trustScore,
      streak: u.streak,
    }));

    return Response.json({ window, entries });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
