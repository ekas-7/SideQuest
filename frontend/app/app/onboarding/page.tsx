"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { useSideQuest } from "@/contexts/sidequest-context";
import {
  ONBOARDING_INTERESTS,
  generateQuestSuggestions,
  type OnboardingInterest,
} from "@/lib/onboarding-data";

export default function OnboardingPage() {
  const {
    isLoaded,
    isSignedIn,
    backendUser,
    onboardingInterests,
    saveOnboardingInterests,
  } = useSideQuest();
  const router = useRouter();

  const [selectedInterests, setSelectedInterests] = useState<OnboardingInterest[]>(
    onboardingInterests
  );

  useEffect(() => {
    setSelectedInterests(onboardingInterests);
  }, [onboardingInterests]);

  const previewSuggestions = useMemo(
    () => generateQuestSuggestions(selectedInterests),
    [selectedInterests]
  );

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <GlassPanel className="mt-6 animate-fade-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
          Sign in to start onboarding
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We use your interests to suggest side quests at easy, medium, and hard levels.
        </p>
        <SignInButton mode="modal">
          <Button type="button" className="mt-5 rounded-full">
            Sign in
          </Button>
        </SignInButton>
      </GlassPanel>
    );
  }

  if (!backendUser) {
    return (
      <GlassPanel className="mt-6 animate-fade-rise">
        <p className="text-muted-foreground">We&apos;re finishing profile setup first.</p>
        <Link href="/app" className="mt-4 inline-block">
          <Button type="button" variant="secondary" className="rounded-full">
            Go to home
          </Button>
        </Link>
      </GlassPanel>
    );
  }

  const toggleInterest = (interest: OnboardingInterest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : prev.length >= 5
          ? prev
          : [...prev, interest]
    );
  };

  const handleSave = () => {
    saveOnboardingInterests(selectedInterests);
    router.push("/app");
  };

  return (
    <div className="space-y-6 pt-4">
      <header className="animate-fade-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
          Onboarding: choose your interests
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick up to 5 interests. We&apos;ll suggest 3 side quests right now: easy, medium, and hard.
        </p>
      </header>

      <GlassPanel className="animate-fade-rise-delay">
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_INTERESTS.map((interest) => {
            const selected = selectedInterests.includes(interest);
            return (
              <Button
                key={interest}
                type="button"
                variant={selected ? "default" : "secondary"}
                className="h-auto rounded-full px-4 py-2"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Button>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {selectedInterests.length}/5 selected
        </p>
        <Button
          type="button"
          className="mt-5 h-auto rounded-full px-6 py-2.5"
          onClick={handleSave}
          disabled={selectedInterests.length === 0}
        >
          Save interests & continue
        </Button>
      </GlassPanel>

      <GlassPanel className="animate-fade-rise-delay-2">
        <h2 className="text-lg font-medium text-foreground">Suggested quests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We generate one quest per level from your selected interests.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {previewSuggestions.map((suggestion) => (
            <div
              key={`${suggestion.difficulty}-${suggestion.interest}`}
              className="rounded-xl border border-border/70 bg-secondary/35 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {suggestion.difficulty}
              </p>
              <h3 className="mt-1 text-base font-medium text-foreground">{suggestion.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Interest: {suggestion.interest}</p>
              <p className="mt-3 text-sm text-muted-foreground">{suggestion.description}</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}