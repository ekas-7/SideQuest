export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

type ErrorDetails = Record<string, unknown> | unknown[] | null;

type ApiErrorBody = {
  error?: {
    message?: string;
    details?: ErrorDetails;
  };
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input and try again.",
  403: "You are not allowed to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with current data.",
  500: "Server error. Please try again shortly.",
};

export class ApiClientError extends Error {
  status: number;
  details?: ErrorDetails;

  constructor(message: string, status: number, details?: ErrorDetails) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

function getDefaultStatusMessage(status: number): string {
  return STATUS_MESSAGES[status] ?? "Request failed. Please try again.";
}

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const url = new URL(path, API_BASE_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

async function safeParseJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function request<TResponse>(
  path: string,
  init: RequestInit,
  query?: Record<string, string | undefined>
): Promise<TResponse> {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const body = await safeParseJson<TResponse & ApiErrorBody>(response);

  if (!response.ok) {
    const message =
      body?.error?.message?.trim() || getDefaultStatusMessage(response.status);

    throw new ApiClientError(message, response.status, body?.error?.details);
  }

  if (!body) {
    throw new ApiClientError(
      "Unexpected empty response from server.",
      response.status
    );
  }

  return body as TResponse;
}

export function getReadableApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export type User = {
  id: string;
  username: string;
  trustScore: number;
  streak: number;
  xp: number;
  strength: number;
  agility: number;
  intelligence: number;
  createdAt: string;
};

export type BackendUser = User;

export type QuestStatFocus = "strength" | "agility" | "intelligence";

export type QuestCatalogItem = {
  id: number;
  title: string;
  description: string;
  toughness: number;
  statFocus: QuestStatFocus;
};

export type WeeklyQuestStatus =
  | "assigned"
  | "submitted"
  | "verified"
  | "rejected";

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

export type WeeklyQuestSource = "existing" | "new" | "rerolled";

export type WeeklyQuestsResponse = {
  weekStart: string;
  quests: WeeklyQuest[];
  rerollUsed: boolean;
  source: WeeklyQuestSource;
};

export type SubmitProofResponse = {
  weeklyQuestId: number;
  verificationJobId: number;
  assignedVoters: number;
  requiredVotes: number;
};

export type VerificationAssignment = {
  id: number;
  jobId: number;
  voterUserId: string;
  vote: boolean | null;
  respondedAt: string | null;
  trustDeltaApplied: boolean;
  createdAt: string;
};

export type VotePendingResult = {
  jobId: number;
  status: "pending";
  votesCollected: number;
  votesRequired: number;
};

export type VoteFinalResult = {
  jobId: number;
  status: "approved" | "rejected";
  approvals: number;
  rejections: number;
  majorityVote: boolean;
  votesUsed: number;
};

export type CastVoteResponse = VotePendingResult | VoteFinalResult;

export async function getHealth() {
  return request<{ status: string }>("/health", { method: "GET" });
}

export async function createUser(payload: { username: string }) {
  return request<{ user: User }>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getQuestCatalog() {
  return request<{ catalog: QuestCatalogItem[] }>("/api/quests/catalog", {
    method: "GET",
  });
}

export async function getWeeklyQuests(userId: string, date: string) {
  return request<WeeklyQuestsResponse>(`/api/quests/weekly/${userId}`, {
    method: "GET",
  }, { date });
}

export async function rerollWeeklyQuests(userId: string, date: string) {
  return request<WeeklyQuestsResponse>(
    `/api/quests/weekly/${userId}/reroll`,
    {
      method: "POST",
    },
    { date }
  );
}

export async function uploadProofPhoto(file: File) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(buildUrl("/api/uploads/proof-photo"), {
    method: "POST",
    body: form,
  });

  const body = await safeParseJson<{ url?: string } & ApiErrorBody>(response);

  if (!response.ok) {
    const message =
      body?.error?.message?.trim() || getDefaultStatusMessage(response.status);

    throw new ApiClientError(message, response.status, body?.error?.details);
  }

  if (!body?.url || typeof body.url !== "string") {
    throw new ApiClientError(
      "Unexpected response from photo upload.",
      response.status
    );
  }

  return { url: body.url };
}

export async function submitWeeklyQuestProof(
  weeklyQuestId: number,
  payload: {
    userId: string;
    description: string;
    proofUrl: string;
  }
) {
  return request<SubmitProofResponse>(`/api/quests/weekly/${weeklyQuestId}/proof`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getVerificationAssignments(voterUserId: string) {
  return request<{ assignments: VerificationAssignment[] }>(
    `/api/verification/assignments/${voterUserId}`,
    {
      method: "GET",
    }
  );
}

export async function castVerificationVote(
  jobId: number,
  payload: {
    voterUserId: string;
    vote: boolean;
  }
) {
  return request<CastVoteResponse>(`/api/verification/jobs/${jobId}/vote`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
