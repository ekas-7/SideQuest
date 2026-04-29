import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { serializeUser } from "@/lib/serializers";
import {
  getAuthUser,
  unauthorizedResponse,
  badRequestResponse,
  conflictResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { username } = body as { username?: string };

    if (!username || typeof username !== "string" || username.trim().length < 2) {
      return badRequestResponse("username must be at least 2 characters");
    }

    await connectToDatabase();

    const existing = await User.findOne({ clerkId: authUser.userId });
    if (existing) {
      return Response.json({ user: serializeUser(existing) }, { status: 200 });
    }

    const usernameConflict = await User.findOne({
      username: username.trim().toLowerCase(),
    });
    if (usernameConflict) {
      return conflictResponse("Username already taken");
    }

    const user = await User.create({
      clerkId: authUser.userId,
      username: username.trim().toLowerCase(),
    });

    return Response.json({ user: serializeUser(user) }, { status: 201 });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
