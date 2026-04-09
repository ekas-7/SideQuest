export const ONBOARDING_INTERESTS = [
  "Fitness",
  "Learning",
  "Creativity",
  "Social",
  "Mindfulness",
  "Adventure",
  "Career",
  "Finance",
  "Wellness",
] as const;

export type OnboardingInterest = (typeof ONBOARDING_INTERESTS)[number];

export function buildOnboardingStorageKey(clerkUserId: string) {
  return `sidequest:onboarding-interests:${clerkUserId}`;
}

/** Session flag: onboarding shown & completed for this browser session (testing / “once per open”). */
export function buildOnboardingSessionKey(clerkUserId: string) {
  return `sidequest:onboarding-session-done:${clerkUserId}`;
}

export function isOnboardingInterest(value: string): value is OnboardingInterest {
  return (ONBOARDING_INTERESTS as readonly string[]).includes(value);
}
