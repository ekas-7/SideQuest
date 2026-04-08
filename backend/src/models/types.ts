export type StatFocus = "strength" | "agility" | "intelligence";

export type User = {
  id: string;
  clerkId: string;
  username: string;
  trustScore: number;
  streak: number;
  xp: number;
  strength: number;
  agility: number;
  intelligence: number;
  createdAt: string;
};

export type QuestCatalogItem = {
  id: number;
  title: string;
  description: string;
  toughness: number;
  statFocus: StatFocus;
};

export type WeeklyQuestStatus = "assigned" | "submitted" | "verified" | "rejected";

export type WeeklyQuest = {
  id: number;
  userId: string;
  weekStart: string;
  slot: number;
  status: WeeklyQuestStatus;
  proofDescription: string | null;
  proofUrl: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  quest: QuestCatalogItem;
};

export type WeeklyQuestsResponse = {
  userId: string;
  weekStart: string;
  quests: WeeklyQuest[];
  canReroll: boolean;
};

export type VerificationAssignment = {
  assignmentId: number;
  jobId: number;
  weeklyQuestId: number;
  proofDescription: string;
  proofUrl: string;
  questTitle: string;
  questDescription: string;
  submittedAt: string;
};

export type CastVoteResponse =
  | {
      status: "pending";
      jobId: number;
      approvals: number;
      rejections: number;
      requiredVotes: number;
    }
  | {
      status: "approved" | "rejected";
      jobId: number;
      approvals: number;
      rejections: number;
      requiredVotes: number;
    };

export type SubmitProofResponse = {
  weeklyQuestId: number;
  verificationJobId: number;
  status: "submitted";
};
