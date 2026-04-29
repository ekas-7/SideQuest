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

function isDuplicateKeyError(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorizedResponse();

  const body = await request.json();
  const { username } = body as { username?: string };

  if (!username || typeof username !== "string" || username.trim().length < 2) {
    return badRequestResponse("username must be at least 2 characters");
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    await connectToDatabase();

    const existing = await User.findOne({ clerkId: authUser.userId });
    if (existing) {
      return Response.json({ user: serializeUser(existing) }, { status: 200 });
    }

    const usernameConflict = await User.findOne({ username: cleanUsername });
    if (usernameConflict) {
      return conflictResponse("Username already taken");
    }

    const user = await User.create({
      clerkId: authUser.userId,
      username: cleanUsername,
    });

    return Response.json({ user: serializeUser(user) }, { status: 201 });
  } catch (err) {
    // Race condition: two concurrent requests tried to create the same clerkId.
    // Return the document that won the race instead of throwing a 500.
    if (isDuplicateKeyError(err)) {
      const raceWinner = await User.findOne({ clerkId: authUser.userId });
      if (raceWinner) {
        return Response.json({ user: serializeUser(raceWinner) }, { status: 200 });
      }
    }
    return serverErrorResponse(err);
  }
}
