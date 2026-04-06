"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { QuestStatFocus, WeeklyQuest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProofPhotoPreview } from "./ProofPhotoPreview";

const QUEST_HERO: Record<QuestStatFocus, string> = {
  strength:
    "https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=800",
  agility:
    "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&q=80&w=800",
  intelligence:
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800",
};

const FOCUS_CINEMA: Record<QuestStatFocus, string> = {
  strength: "Physical Mastery",
  agility: "Kinetic Edge",
  intelligence: "Deep Focus",
};

function activeSeekersHint(questCatalogId: number, slot: number) {
  const n = 8 + ((questCatalogId * 3 + slot * 7) % 18);
  return `${n} Active Seekers`;
}

export function QuestActionCard({
  weeklyQuest,
  draft,
  isProofPending,
  proofStatus,
  onDescriptionChange,
  onFileChange,
  onSubmitProof,
}: {
  weeklyQuest: WeeklyQuest;
  draft: { description: string; file: File | null };
  isProofPending: boolean;
  proofStatus?: string;
  onDescriptionChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmitProof: () => void;
}) {
  const canSubmitProof = ["assigned", "rejected"].includes(weeklyQuest.status);
  const q = weeklyQuest.quest;
  const heroSrc = QUEST_HERO[q.statFocus];
  const category = FOCUS_CINEMA[q.statFocus];

  const [detailsOpen, setDetailsOpen] = useState(
    () =>
      ["assigned", "rejected"].includes(weeklyQuest.status) ||
      Boolean(weeklyQuest.proofUrl && weeklyQuest.status !== "assigned")
  );

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-3xl border border-white/5 bg-surface cinematic-shadow",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_32px_64px_-16px_rgb(0_0_0/0.55)]"
      )}
    >
      <div className="relative h-48">
        {/* eslint-disable-next-line @next/next/no-img-element -- Unsplash hero */}
        <img
          src={heroSrc}
          alt={q.title}
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        <div className="absolute bottom-4 left-6">
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-[family-name:var(--font-body)] text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            {category}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md",
              weeklyQuest.status === "assigned" && "border-primary/30 bg-primary/15 text-primary",
              weeklyQuest.status === "submitted" && "border-white/15 bg-white/10 text-white/80",
              weeklyQuest.status === "verified" && "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
              weeklyQuest.status === "rejected" && "border-red-400/30 bg-red-500/15 text-red-200"
            )}
          >
            {weeklyQuest.status}
          </span>
        </div>
      </div>

      <div className="p-8">
        <h3 className="mb-3 font-[family-name:var(--font-display)] text-3xl italic text-white">
          {q.title}
        </h3>
        <p className="mb-8 text-sm italic leading-relaxed text-muted-foreground">
          {q.description}
        </p>
        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {activeSeekersHint(q.id, weeklyQuest.slot)}
          </span>
          <button
            type="button"
            className="text-[10px] font-bold uppercase tracking-widest text-primary transition hover:underline"
            onClick={() => setDetailsOpen((o) => !o)}
          >
            {detailsOpen ? "Hide" : "Details"}
          </button>
        </div>
        <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-white/35">
          Difficulty {q.toughness}/5 · Slot {weeklyQuest.slot}
        </p>
      </div>

      {detailsOpen && (
        <div className="space-y-4 border-t border-white/5 bg-black/25 px-8 py-8">
          {weeklyQuest.proofUrl && weeklyQuest.status !== "assigned" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Submitted proof
              </p>
              {weeklyQuest.proofDescription && (
                <p className="mt-2 text-sm text-white/90">{weeklyQuest.proofDescription}</p>
              )}
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element -- API-hosted proof URL */}
                <img
                  src={weeklyQuest.proofUrl}
                  alt="Proof"
                  className="max-h-56 w-full object-contain"
                />
              </div>
            </div>
          )}

          {canSubmitProof && (
            <>
              <Textarea
                placeholder="Describe what you did — this is your proof caption."
                value={draft.description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                disabled={isProofPending}
                className="min-h-[100px] resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus-visible:border-primary/50 focus-visible:ring-0"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <label className="inline-flex cursor-pointer">
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                    Upload photo
                  </span>
                  <input
                    key={draft.file ? `${draft.file.name}-${draft.file.size}` : "no-file"}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={isProofPending}
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  />
                </label>
                {draft.file && (
                  <>
                    <span className="truncate text-sm text-white/50">{draft.file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto rounded-full border-0 px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 hover:text-white"
                      disabled={isProofPending}
                      onClick={() => onFileChange(null)}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
              <ProofPhotoPreview file={draft.file} variant="cinematic" />
              <Button
                type="button"
                className="h-auto rounded-full px-8 py-3"
                disabled={isProofPending}
                onClick={onSubmitProof}
              >
                {isProofPending ? "Submitting…" : "Submit proof"}
              </Button>
              {proofStatus && (
                <p className="text-sm text-muted-foreground">{proofStatus}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
