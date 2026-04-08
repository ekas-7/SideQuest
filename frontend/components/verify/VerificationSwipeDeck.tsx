"use client";

import { useMemo, useRef, useState } from "react";
import type { VerificationAssignment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { VerificationReviewCard } from "./VerificationReviewCard";

const SWIPE_THRESHOLD = 110;

type Props = {
  assignments: VerificationAssignment[];
  votePendingByJobId: Record<number, boolean>;
  voteStatusByJobId: Record<number, string>;
  onApprove: (jobId: number) => Promise<void>;
  onReject: (jobId: number) => Promise<void>;
};

export function VerificationSwipeDeck({
  assignments,
  votePendingByJobId,
  voteStatusByJobId,
  onApprove,
  onReject,
}: Props) {
  const pendingAssignments = useMemo(
    () => assignments.filter((a) => a.jobStatus === "pending" && a.vote === null),
    [assignments]
  );

  const [dismissedJobIds, setDismissedJobIds] = useState<number[]>([]);
  const [skipOffset, setSkipOffset] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef<number | null>(null);

  const activeAssignments = useMemo(
    () =>
      pendingAssignments.filter(
        (assignment) => !dismissedJobIds.includes(assignment.jobId)
      ),
    [dismissedJobIds, pendingAssignments]
  );

  const currentIndex =
    activeAssignments.length > 0 ? skipOffset % activeAssignments.length : 0;
  const current = activeAssignments[currentIndex] ?? null;
  const currentPending = current ? (votePendingByJobId[current.jobId] ?? false) : false;
  const currentStatus = current ? voteStatusByJobId[current.jobId] : undefined;

  const rotateQueue = () => {
    if (!current || activeAssignments.length <= 1) {
      return;
    }
    setSkipOffset((prev) => prev + 1);
  };

  const castVote = async (vote: boolean) => {
    if (!current || currentPending) {
      return;
    }

    const jobId = current.jobId;
  setDismissedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
    setDragX(0);

    if (vote) {
      await onApprove(jobId);
      return;
    }

    await onReject(jobId);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!current || currentPending) {
      return;
    }
    startXRef.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || startXRef.current === null) {
      return;
    }
    setDragX(event.clientX - startXRef.current);
  };

  const endDrag = async () => {
    const delta = dragX;
    setDragging(false);
    startXRef.current = null;

    if (delta > SWIPE_THRESHOLD) {
      await castVote(true);
      return;
    }

    if (delta < -SWIPE_THRESHOLD) {
      await castVote(false);
      return;
    }

    setDragX(0);
  };

  if (!current) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-base text-white/90">No pending cards right now.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          You are caught up. Pull to refresh when new proof arrives.
        </p>
      </div>
    );
  }

  const swipeDirection = dragX > 36 ? "approve" : dragX < -36 ? "reject" : null;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="pointer-events-none absolute inset-0 -z-10 scale-[0.97] rounded-3xl border border-white/10 bg-white/5" />
        <div
          className={cn(
            "transition-transform duration-200",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX * 0.035}deg)`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => void endDrag()}
          onPointerCancel={() => void endDrag()}
        >
          <VerificationReviewCard
            assignment={current}
            isVotePending={currentPending}
            voteStatus={currentStatus}
            onApprove={() => void castVote(true)}
            onReject={() => void castVote(false)}
            hideActions
            swipeHint
          />
        </div>

        <div className="pointer-events-none absolute inset-y-6 left-4 flex items-center">
          <span
            className={cn(
              "rounded-full border border-red-400/35 bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-200 transition-opacity",
              swipeDirection === "reject" ? "opacity-100" : "opacity-0"
            )}
          >
            Incorrect
          </span>
        </div>

        <div className="pointer-events-none absolute inset-y-6 right-4 flex items-center">
          <span
            className={cn(
              "rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200 transition-opacity",
              swipeDirection === "approve" ? "opacity-100" : "opacity-0"
            )}
          >
            Correct
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-md items-center justify-center gap-4">
        <button
          type="button"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-red-200 transition hover:scale-105 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPending}
          onClick={() => void castVote(false)}
          aria-label="Mark proof incorrect"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <button
          type="button"
          className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary transition hover:scale-105 hover:bg-primary/30"
          onClick={rotateQueue}
          aria-label="Skip this card"
          title="Skip"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <button
          type="button"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 transition hover:scale-105 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPending}
          onClick={() => void castVote(true)}
          aria-label="Mark proof correct"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
        Swipe left to reject · Swipe right to approve · Tap + to skip
      </p>
    </div>
  );
}