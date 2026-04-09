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
