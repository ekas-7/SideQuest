import type { CastVoteResponse, SubmitProofResponse } from "@/lib/api";

export function getVoteResultText(result: CastVoteResponse): string {
  if (result.status === "pending") {
    return `Vote recorded — ${result.votesCollected}/${result.votesRequired} votes collected.`;
  }

  return `Vote finalized: ${result.status} (approvals ${result.approvals}, rejections ${result.rejections}).`;
}

export function getProofResultText(result: SubmitProofResponse): string {
  return `Proof submitted! Verification job #${result.verificationJobId} created (${result.assignedVoters} voters, ${result.requiredVotes} needed).`;
}

export function buildStorageKey(clerkUserId: string) {
  return `sidequest:backend-user:${clerkUserId}`;
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}
