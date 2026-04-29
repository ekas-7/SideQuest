import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { QuestCatalog } from "@/lib/models/QuestCatalog";
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
} from "@/lib/server-auth";
import { serializeQuestCatalogItem } from "@/lib/serializers";
import { ONBOARDING_INTERESTS, isOnboardingInterest } from "@/lib/onboarding-data";

export const dynamic = "force-dynamic";

async function buildSuggestions(interests: string[]) {
  await connectToDatabase();

  const interestToStatFocus: Record<string, string[]> = {
    Fitness: ["strength", "agility"],
    Learning: ["intelligence"],
    Creativity: ["intelligence", "agility"],
    Social: ["agility"],
    Mindfulness: ["agility", "intelligence"],
    Adventure: ["strength", "agility"],
    Career: ["intelligence"],
    Finance: ["intelligence"],
    Wellness: ["strength", "agility"],
  };

  const statFocuses = new Set<string>();
  for (const interest of interests) {
    const foci = interestToStatFocus[interest] ?? [];
    foci.forEach((f) => statFocuses.add(f));
  }

  const query =
    statFocuses.size > 0
      ? { statFocus: { $in: Array.from(statFocuses) as ("strength" | "agility" | "intelligence")[] } }
      : {};

  const suggestions = await QuestCatalog.find(query).limit(6).lean();
  return suggestions.map(serializeQuestCatalogItem);
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    const suggestions = user.onboardingCompleted
      ? await buildSuggestions(user.onboardingInterests)
      : [];

    return Response.json({
      completed: user.onboardingCompleted,
      interests: user.onboardingInterests,
      suggestions,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { interests } = body as { interests?: unknown };

    if (!Array.isArray(interests) || interests.length === 0) {
      return badRequestResponse("interests must be a non-empty array");
    }

    const validInterests = interests.filter(isOnboardingInterest);
    if (validInterests.length === 0) {
      return badRequestResponse(
        `interests must contain valid values: ${ONBOARDING_INTERESTS.join(", ")}`
      );
    }

    const uniqueInterests = [...new Set(validInterests)].slice(0, 5);

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    user.onboardingInterests = uniqueInterests;
    user.onboardingCompleted = true;
    await user.save();

    const suggestions = await buildSuggestions(uniqueInterests);

    return Response.json({
      completed: true,
      interests: uniqueInterests,
      suggestions,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
