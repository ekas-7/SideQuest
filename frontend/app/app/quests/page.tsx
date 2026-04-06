"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { QuestActionCard } from "@/components/quests/QuestActionCard";
import { useSideQuest } from "@/contexts/sidequest-context";

export default function QuestsPage() {
  const {
    isLoaded,
    isSignedIn,
    backendUser,
    weeklyData,
    weeklyError,
    isWeeklyLoading,
    isRerolling,
    loadWeeklyQuests,
    handleReroll,
    proofDrafts,
    proofPendingByQuestId,
    proofStatusByQuestId,
    handleProofDescriptionChange,
    handleProofFileChange,
    handleSubmitProof,
  } = useSideQuest();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <GlassPanel className="animate-fade-rise mt-6">
        <p className="text-muted-foreground">Sign in to see your weekly board.</p>
        <SignInButton mode="modal">
          <Button type="button" className="mt-4 rounded-full">
            Sign in
          </Button>
        </SignInButton>
      </GlassPanel>
    );
  }

  if (!backendUser) {
    return (
      <GlassPanel className="animate-fade-rise mt-6">
        <p className="text-muted-foreground">Create your profile on the home tab first.</p>
        <Link href="/app" className="mt-4 inline-block">
          <Button type="button" variant="secondary" className="rounded-full">
            Go to home
          </Button>
        </Link>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="animate-fade-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
            Weekly quests
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Week {weeklyData?.weekStart ?? "—"} ·{" "}
            {weeklyData?.rerollUsed ? "Reroll used" : "One reroll available"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={() => void loadWeeklyQuests()}
            disabled={isWeeklyLoading}
          >
            {isWeeklyLoading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => void handleReroll()}
            disabled={isWeeklyLoading || isRerolling || !weeklyData || weeklyData.rerollUsed}
          >
            {isRerolling ? "Rerolling…" : weeklyData?.rerollUsed ? "Reroll spent" : "Reroll board"}
          </Button>
        </div>
      </div>

      {weeklyError && (
        <p className="text-sm text-red-300">{weeklyError}</p>
      )}

      {!weeklyError && weeklyData && weeklyData.quests.length === 0 && (
        <GlassPanel>
          <p className="text-muted-foreground">No quests assigned yet. Try refreshing.</p>
        </GlassPanel>
      )}

      <div className="flex flex-col gap-5">
        {weeklyData?.quests.map((weeklyQuest, index) => {
          const draft = proofDrafts[weeklyQuest.id] ?? { description: "", file: null };
          const delayClass =
            index === 0
              ? "animate-fade-rise"
              : index === 1
                ? "animate-fade-rise-delay"
                : "animate-fade-rise-delay-2";

          return (
            <div key={weeklyQuest.id} className={delayClass}>
              <QuestActionCard
                key={`${weeklyQuest.id}-${weeklyQuest.status}-${weeklyQuest.proofUrl ?? ""}`}
                weeklyQuest={weeklyQuest}
                draft={draft}
                isProofPending={proofPendingByQuestId[weeklyQuest.id] ?? false}
                proofStatus={proofStatusByQuestId[weeklyQuest.id]}
                onDescriptionChange={(v) => handleProofDescriptionChange(weeklyQuest.id, v)}
                onFileChange={(f) => handleProofFileChange(weeklyQuest.id, f)}
                onSubmitProof={() => void handleSubmitProof(weeklyQuest)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
