export type BackendUser = {
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

export type QuestCatalogItem = {
	id: string;
	title: string;
	description: string;
	toughness: number;
	statFocus: "strength" | "agility" | "intelligence";
	categories: string[];
};

export type WeeklyQuestStatus = "assigned" | "submitted" | "verified" | "rejected";

export type WeeklyQuest = {
	id: string;
	userId: string;
	weekStart: string;
	slot: number;
	status: WeeklyQuestStatus;
	proofDescription: string | null;
	proofUrl: string | null;
	submittedAt: string | null;
	verifiedAt: string | null;
	rerollUsed: boolean;
	createdAt: string;
	quest: QuestCatalogItem | null;
};

export type WeeklyQuestsResponse = {
	weekStart: string;
	quests: WeeklyQuest[];
	rerollUsed: boolean;
};

export type OnboardingSuggestion = QuestCatalogItem;

export type OnboardingResponse = {
	completed: boolean;
	interests: string[];
	suggestions: OnboardingSuggestion[];
};

export type VerificationJobStatus = "pending" | "approved" | "rejected";

export type VerificationJob = {
	id: string;
	weeklyQuestId: string;
	submitterUserId: string;
	status: VerificationJobStatus;
	approvals: number;
	rejections: number;
	requiredVotes: number;
	proofUrl: string;
	proofDescription: string;
	createdAt: string;
};

export type VerificationAssignment = VerificationJob & {
	weeklyQuest: { id: string; userId: string; weekStart: string; slot: number } | null;
	quest: Pick<QuestCatalogItem, "id" | "title" | "description" | "toughness" | "statFocus"> | null;
};

export type Notification = {
	id: string;
	type: string;
	title: string;
	message: string;
	read: boolean;
	metadata: Record<string, unknown>;
	createdAt: string;
};

export type LeaderboardEntry = {
	rank: number;
	userId: string;
	username: string;
	xp: number;
	trustScore: number;
	streak: number;
};

type RequestOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: BodyInit | Record<string, unknown>;
	/** @deprecated auth is handled via Clerk session cookies */
	clerkUserId?: string;
};

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object";
}

function getErrorMessage(payload: unknown): string | null {
	if (typeof payload === "string") return payload;
	if (!isRecord(payload)) return null;
	if (typeof payload.message === "string") return payload.message;
	if (typeof payload.error === "string") return payload.error;
	if (isRecord(payload.error) && typeof payload.error.message === "string") {
		return payload.error.message;
	}
	return null;
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return null;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

export class ApiClientError extends Error {
	status: number;
	data: unknown;

	constructor(message: string, status: number, data: unknown) {
		super(message);
		this.name = "ApiClientError";
		this.status = status;
		this.data = data;
	}
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = "GET", body } = options;

	const headers = new Headers();

	let requestBody: BodyInit | undefined;
	if (body instanceof FormData) {
		requestBody = body;
	} else if (body !== undefined) {
		headers.set("Content-Type", "application/json");
		requestBody = JSON.stringify(body);
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		method,
		headers,
		body: requestBody,
	});

	const payload = await parseResponseBody(response);

	if (!response.ok) {
		const message =
			getErrorMessage(payload) ||
			`Request failed (${response.status} ${response.statusText})`;
		throw new ApiClientError(message, response.status, payload);
	}

	return payload as T;
}

// ─── Auth + User ──────────────────────────────────────────────────────────────

/** Creates a user profile after Clerk sign-in. Returns 200 if already exists. */
export function createUser(
	payload: { username: string },
	_clerkUserId?: string
): Promise<{ user: BackendUser }> {
	return request<{ user: BackendUser }>("/api/users", {
		method: "POST",
		body: payload,
	});
}

export function getMe(): Promise<{ user: BackendUser }> {
	return request<{ user: BackendUser }>("/api/users/me");
}

export function updateMe(
	payload: { username?: string }
): Promise<{ user: BackendUser }> {
	return request<{ user: BackendUser }>("/api/users/me", {
		method: "PATCH",
		body: payload,
	});
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export function getOnboarding(): Promise<OnboardingResponse> {
	return request<OnboardingResponse>("/api/onboarding/me");
}

export function saveOnboarding(
	payload: { interests: string[] }
): Promise<OnboardingResponse> {
	return request<OnboardingResponse>("/api/onboarding/me", {
		method: "PUT",
		body: payload,
	});
}

// ─── Quest Catalog ────────────────────────────────────────────────────────────

export function getQuestCatalog(): Promise<{ catalog: QuestCatalogItem[] }> {
	return request<{ catalog: QuestCatalogItem[] }>("/api/quests/catalog");
}

// ─── Weekly Quests ────────────────────────────────────────────────────────────

export function getWeeklyQuests(
	userId: string,
	date?: string
): Promise<WeeklyQuestsResponse> {
	const qs = date ? `?date=${date}` : "";
	return request<WeeklyQuestsResponse>(`/api/quests/weekly/${userId}${qs}`);
}

export function rerollWeeklyQuests(
	userId: string,
	date?: string
): Promise<WeeklyQuestsResponse> {
	const qs = date ? `?date=${date}` : "";
	return request<WeeklyQuestsResponse>(
		`/api/quests/weekly/${userId}/reroll${qs}`,
		{ method: "POST" }
	);
}

export function getQuestHistory(
	userId: string,
	limit = 20,
	cursor?: string
): Promise<{ items: WeeklyQuest[]; nextCursor: string | null }> {
	const params = new URLSearchParams({ limit: String(limit) });
	if (cursor) params.set("cursor", cursor);
	return request(`/api/quests/weekly/${userId}/history?${params}`);
}

// ─── Proof Upload + Submission ────────────────────────────────────────────────

export function uploadProofPhoto(file: File): Promise<{ url: string }> {
	const formData = new FormData();
	formData.append("file", file);
	return request<{ url: string }>("/api/uploads/proof-photo", {
		method: "POST",
		body: formData,
	});
}

export function submitProof(
	weeklyQuestId: string,
	payload: { userId: string; description: string; proofUrl: string }
): Promise<{ weeklyQuestId: string; job: VerificationJob; status: string }> {
	return request(`/api/quests/weekly/${weeklyQuestId}/proof`, {
		method: "POST",
		body: payload,
	});
}

// ─── Verification ─────────────────────────────────────────────────────────────

export function getVerificationAssignments(
	voterUserId: string
): Promise<{ assignments: VerificationAssignment[] }> {
	return request(`/api/verification/assignments/${voterUserId}`);
}

export function getVerificationJob(
	jobId: string
): Promise<{
	job: {
		id: string;
		status: VerificationJobStatus;
		approvals: number;
		rejections: number;
		requiredVotes: number;
	};
}> {
	return request(`/api/verification/jobs/${jobId}`);
}

export function castVote(
	jobId: string,
	payload: { voterUserId: string; vote: boolean }
): Promise<{
	status: VerificationJobStatus | "pending";
	approvals: number;
	rejections: number;
	requiredVotes: number;
	finalized: boolean;
}> {
	return request(`/api/verification/jobs/${jobId}/vote`, {
		method: "POST",
		body: payload,
	});
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getDashboard(userId: string): Promise<{
	user: BackendUser;
	weekly: WeeklyQuestsResponse;
	pendingVerification: number;
}> {
	return request(`/api/dashboard/${userId}`);
}

export function getUserStats(userId: string): Promise<{
	streakHistory: Array<{ date: string; value: number }>;
	xpHistory: Array<{ date: string; value: number }>;
	trustHistory: Array<{ date: string; value: number }>;
}> {
	return request(`/api/users/${userId}/stats`);
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export function getLeaderboard(
	window: "weekly" | "all_time" = "all_time",
	limit = 50
): Promise<{ window: string; entries: LeaderboardEntry[] }> {
	return request(`/api/leaderboard?window=${window}&limit=${limit}`);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getNotifications(): Promise<{
	notifications: Notification[];
	unreadCount: number;
}> {
	return request("/api/notifications/me");
}

export function markNotificationRead(
	id: string
): Promise<{ notification: Notification }> {
	return request(`/api/notifications/${id}/read`, { method: "PATCH" });
}
