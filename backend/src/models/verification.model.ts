export type VerificationJobStatus = "pending" | "approved" | "rejected";

export interface VerificationJob {
  id: number;
  weeklySideQuestId: number;
  requiredVotes: number;
  status: VerificationJobStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface VerificationVote {
  assignmentId: number;
  voterUserId: string;
  vote: boolean;
  respondedAt: string;
}
