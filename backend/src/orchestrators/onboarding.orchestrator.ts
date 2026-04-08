import { runInTransaction } from "../config/database.ts";
import { onboardingService } from "../services/onboarding.service.ts";
import { userService } from "../services/user.service.ts";
import { HttpError } from "../utils/http.ts";

function toSuggestions(interests: string[]) {
  if (interests.length === 0) {
    return [
      { title: "Daily 20-Minute Walk", description: "Build consistency with a low-friction movement quest." },
      { title: "Hydration Challenge", description: "Track and complete 2L of water in one day." },
    ];
  }

  return interests.slice(0, 3).map((interest) => ({
    title: `${interest} Starter Quest`,
    description: `A beginner side quest tailored to your interest in ${interest}.`,
  }));
}

export async function getOnboardingOrchestrator(clerkUserId: string) {
  const user = await userService.getByClerkId(clerkUserId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User profile not found");

  return onboardingService.getOnboarding(user.id);
}

export async function upsertOnboardingOrchestrator(clerkUserId: string, interests: string[]) {
  return runInTransaction(async (client) => {
    const user = await userService.getByClerkId(clerkUserId, client);
    if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User profile not found");

    const suggestions = toSuggestions(interests);
    return onboardingService.upsertOnboarding(user.id, interests, suggestions, client);
  });
}
