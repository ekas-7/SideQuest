export type QuestStatFocus = "strength" | "agility" | "intelligence";

export type WeeklyQuestStatus =
	| "assigned"
	| "submitted"
	| "verified"
	| "rejected";

export type VerificationJobStatus = "pending" | "approved" | "rejected";

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
	id: number;
	title: string;
	description: string;
	toughness: number;
	statFocus: QuestStatFocus;
};

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
	rerollsUsed?: number;
	rerollsRemaining?: number;
};

export type VerificationAssignment = {
	jobId: number;
	requiredVotes: number;
	jobStatus: VerificationJobStatus;
	vote: boolean | null;
	submitterUsername: string;
	submittedAt: string | null;
	questTitle: string;
	proofDescription: string | null;
	proofUrl: string | null;
};

export type SubmitProofResponse = {
	verificationJobId: number;
	assignedVoters: number;
	requiredVotes: number;
};

export type CastVoteResponse =
	| {
			status: "pending";
			votesCollected: number;
			votesRequired: number;
			approvals: number;
			rejections: number;
		}
	| {
			status: "approved" | "rejected";
			approvals: number;
			rejections: number;
			votesCollected?: number;
			votesRequired?: number;
		};

type RequestOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: BodyInit | Record<string, unknown>;
	clerkUserId?: string;
};

type ApiEnvelope<T> = {
	data: T;
	error: { message?: string } | string | null;
};

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
	"http://localhost:3001";

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
	if (!value || typeof value !== "object") {
		return false;
	}

	return "data" in value && "error" in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object";
}

function getErrorMessage(payload: unknown): string | null {
	if (typeof payload === "string") {
		return payload;
	}

	if (!isRecord(payload)) {
		return null;
	}

	if (typeof payload.message === "string") {
		return payload.message;
	}

	if (typeof payload.error === "string") {
		return payload.error;
	}

	if (isRecord(payload.error) && typeof payload.error.message === "string") {
		return payload.error.message;
	}

	return null;
}

function unwrapData<T>(payload: unknown): T {
	if (isApiEnvelope(payload)) {
		return payload.data as T;
	}

	return payload as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) {
		return null;
	}

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
	const { method = "GET", body, clerkUserId } = options;

	const headers = new Headers();
	if (clerkUserId) {
		headers.set("x-clerk-user-id", clerkUserId);
	}

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

	return unwrapData<T>(payload);
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

export function createUser(
	payload: { username: string },
	clerkUserId: string
): Promise<{ user: BackendUser }> {
	return request<{ user: BackendUser }>("/api/users", {
		method: "POST",
		body: payload,
		clerkUserId,
	});
}

export function getCurrentUser(clerkUserId: string): Promise<{ user: BackendUser }> {
	return request<{ user: BackendUser }>("/api/users/me", {
		method: "GET",
		clerkUserId,
	});
}

export function getQuestCatalog(
	clerkUserId: string
): Promise<{ catalog: QuestCatalogItem[] }> {
	return request<{ catalog: QuestCatalogItem[] }>("/api/quests/catalog", {
		method: "GET",
		clerkUserId,
	});
}

export function getWeeklyQuests(
	userId: string,
	date: string,
	clerkUserId: string
): Promise<WeeklyQuestsResponse> {
	const query = new URLSearchParams({ date });
	return request<WeeklyQuestsResponse>(`/api/quests/weekly/${userId}?${query.toString()}`, {
		method: "GET",
		clerkUserId,
	});
}

export function rerollWeeklyQuests(
	userId: string,
	date: string,
	clerkUserId: string
): Promise<WeeklyQuestsResponse> {
	const query = new URLSearchParams({ date });
	return request<WeeklyQuestsResponse>(
		`/api/quests/weekly/${userId}/reroll?${query.toString()}`,
		{
			method: "POST",
			clerkUserId,
		}
	);
}

export function uploadProofPhoto(
	file: File,
	clerkUserId: string
): Promise<{ url: string }> {
	const formData = new FormData();
	formData.set("file", file);

	return request<{ url: string }>("/api/uploads/proof-photo", {
		method: "POST",
		body: formData,
		clerkUserId,
	});
}

export function submitWeeklyQuestProof(
	weeklyQuestId: number,
	payload: { userId: string; description: string; proofUrl: string },
	clerkUserId: string
): Promise<SubmitProofResponse> {
	return request<SubmitProofResponse>(`/api/quests/weekly/${weeklyQuestId}/proof`, {
		method: "POST",
		body: payload,
		clerkUserId,
	});
}

export function getVerificationAssignments(
	voterUserId: string,
	clerkUserId: string
): Promise<{ assignments: VerificationAssignment[] }> {
	return request<{ assignments: VerificationAssignment[] }>(
		`/api/verification/assignments/${voterUserId}`,
		{
			method: "GET",
			clerkUserId,
		}
	);
}

export function castVerificationVote(
	jobId: number,
	payload: { voterUserId: string; vote: boolean },
	clerkUserId: string
): Promise<CastVoteResponse> {
	return request<CastVoteResponse>(`/api/verification/jobs/${jobId}/vote`, {
		method: "POST",
		body: payload,
		clerkUserId,
	});
}
