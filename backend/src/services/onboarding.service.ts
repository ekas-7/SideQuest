import { getOnboardingRepo, upsertOnboardingRepo } from "../repositories/onboarding.repo.ts";

export const onboardingService = {
  getOnboarding: getOnboardingRepo,
  upsertOnboarding: upsertOnboardingRepo,
};
