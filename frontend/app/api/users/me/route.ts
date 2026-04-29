import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { serializeUser } from "@/lib/serializers";
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  conflictResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    return Response.json({ user: serializeUser(user) });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { username } = body as { username?: string };

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length < 2) {
        return badRequestResponse("username must be at least 2 characters");
      }
      const taken = await User.findOne({
        username: username.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (taken) return conflictResponse("Username already taken");
      user.username = username.trim().toLowerCase();
    }

    await user.save();
    return Response.json({ user: serializeUser(user) });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
