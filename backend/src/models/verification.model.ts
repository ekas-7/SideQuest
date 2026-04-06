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

export interface VerificationAssignmentDetail {
  id: number;
  jobId: number;
  voterUserId: string;
  vote: boolean | null;
  respondedAt: string | null;
  trustDeltaApplied: boolean;
  createdAt: string;
  jobStatus: VerificationJobStatus;
  requiredVotes: number;
  questTitle: string;
  proofDescription: string | null;
  proofUrl: string | null;
  submitterUsername: string;
  submittedAt: string | null;
}
