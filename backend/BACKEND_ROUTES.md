# SideQuest Backend Routes (Bun + PostgreSQL)

This spec is aligned with `Backend_Rules.md` and assumes:

- Runtime: **Bun + TypeScript**
- Database: **PostgreSQL** (parameterized SQL only)
- Auth: Clerk JWT/session trusted by backend auth middleware
- Strict architecture flow: **Route → Controller → Vali → Orchestrator → Service → Repository → Database**

---

## 1) Route Layer Contract (must be followed for every endpoint)

For each route, implement files using naming rules:

- `src/routes/<feature>.routes.ts`
- `src/controllers/<feature>.controller.ts`
- `src/vali/<feature>.vali.ts`
- `src/orchestrators/<feature>.orchestrator.ts`
- `src/services/<feature>.service.ts`
- `src/repositories/<feature>.repo.ts`

### Standard response envelope

```ts
type ApiSuccess<T> = { data: T; error: null };
type ApiError = { data: null; error: { code: string; message: string; details?: unknown } };
```

### Common HTTP error mapping

- `400` invalid request body/query/params
- `401` unauthenticated
- `403` unauthorized ownership/action
- `404` resource not found
- `409` conflict/business rule violation
- `422` semantically invalid state transition
- `500` unexpected server error

---

## 2) Health

### `GET /health`

**Purpose**
- Service uptime check.

**Controller**
- `health.controller.ts` → `getHealthController`

**Response `200`**

```json
{ "data": { "status": "ok" }, "error": null }
```

---

## 3) Auth + User Profile

### `POST /api/users`

**Purpose**
- Create backend user profile after first Clerk sign-in.

**Vali input**
- Body: `{ "username": string }` (trim/lowercase, length + charset checks)

**Orchestrator rules**
- Ensure Clerk identity exists.
- Enforce unique username.

**Response `201`**
- `{ data: { user: User }, error: null }`

**Errors**
- `409` username exists

### `GET /api/users/me`

**Purpose**
- Fetch profile using auth context (no localStorage dependency).

**Response `200`**
- `{ data: { user: User }, error: null }`

### `PATCH /api/users/me`

**Purpose**
- Update editable profile fields.

**Vali input**
- Body: `{ "username"?: string }`

**Response `200`**
- `{ data: { user: User }, error: null }`

---

## 4) Onboarding

### `GET /api/onboarding/me`

**Purpose**
- Return onboarding completion state, interests, and suggestions.

**Response `200`**

```json
{
	"data": {
		"completed": true,
		"interests": [],
		"suggestions": []
	},
	"error": null
}
```

### `PUT /api/onboarding/me`

**Purpose**
- Save interests and compute/update suggestions server-side.

**Vali input**
- Body: `{ "interests": OnboardingInterest[] }`

**Response `200`**
- `{ data: { completed: boolean, interests: OnboardingInterest[], suggestions: SuggestedSideQuest[] }, error: null }`

---

## 5) Quest Catalog + Weekly Assignment

### `GET /api/quests/catalog`

**Purpose**
- Return canonical quest catalog.

**Response `200`**
- `{ data: { catalog: QuestCatalogItem[] }, error: null }`

### `GET /api/quests/weekly/:userId?date=YYYY-MM-DD`

**Purpose**
- Return weekly quests for user + week.
- If none exist for that week, orchestrator assigns them.

**Vali input**
- Params: `userId`
- Query: optional ISO date

**Response `200`**
- `{ data: WeeklyQuestsResponse, error: null }`

### `POST /api/quests/weekly/:userId/reroll?date=YYYY-MM-DD`

**Purpose**
- Re-roll weekly quests, typically max once per week.

**Orchestrator rules**
- Check reroll quota.
- Replace assignments atomically (DB transaction).

**Response `200`**
- `{ data: WeeklyQuestsResponse, error: null }`

**Errors**
- `409` reroll already used

### `GET /api/quests/weekly/:userId/history?limit=20&cursor=...`

**Purpose**
- Paginated quest history for profile/analytics.

**Response `200`**
- `{ data: { items: WeeklyQuest[], nextCursor: string | null }, error: null }`

---

## 6) Proof Upload + Submission

### `POST /api/uploads/proof-photo`

**Purpose**
- Upload proof image and return URL.

**Vali input**
- `multipart/form-data` with `file`
- Validate file type, max size

**Response `200`**
- `{ data: { url: string }, error: null }`

### `POST /api/quests/weekly/:weeklyQuestId/proof`

**Purpose**
- Submit quest proof, create verification job, assign voters.

**Vali input**
- Params: `weeklyQuestId`
- Body: `{ "userId": string, "description": string, "proofUrl": string }`

**Orchestrator rules**
- Verify ownership.
- Validate quest state allows submission.
- Create verification job + assignments in one transaction.

**Response `201`**
- `{ data: SubmitProofResponse, error: null }`

**Errors**
- `400` invalid fields
- `403` quest owner mismatch
- `422` invalid quest state transition

---

## 7) Verification Queue + Voting

### `GET /api/verification/assignments/:voterUserId`

**Purpose**
- Return assigned verification cards for voter.

**Response `200`**
- `{ data: { assignments: VerificationAssignment[] }, error: null }`

### `POST /api/verification/jobs/:jobId/vote`

**Purpose**
- Cast approve/reject vote and finalize when threshold is met.

**Vali input**
- Body: `{ "voterUserId": string, "vote": boolean }`

**Orchestrator rules**
- Ensure assignment exists + not already voted.
- Persist vote.
- Recompute tally.
- If threshold reached, finalize job and update weekly quest/user stats transactionally.

**Response `200`**
- `{ data: CastVoteResponse, error: null }`

### `GET /api/verification/jobs/:jobId`

**Purpose**
- Read verification tally/status for polling.

**Response `200`**

```json
{
	"data": {
		"job": {
			"id": 1,
			"status": "pending",
			"approvals": 0,
			"rejections": 0,
			"requiredVotes": 3
		}
	},
	"error": null
}
```

---

## 8) Dashboard + Profile Stats

### `GET /api/dashboard/:userId`

**Purpose**
- Aggregated payload to reduce frontend round-trips.

**Response `200`**
- `{ data: { user: User, weekly: WeeklyQuestsResponse, pendingVerification: number }, error: null }`

### `GET /api/users/:userId/stats`

**Purpose**
- Longitudinal metric series for charts.

**Response `200`**
- `{ data: { streakHistory: Point[], xpHistory: Point[], trustHistory: Point[] }, error: null }`

---

## 9) Optional High-Value Routes

- `GET /api/leaderboard?window=weekly|all_time&limit=50`
- `GET /api/notifications/me`
- `PATCH /api/notifications/:id/read`

---

## 10) Canonical Type Sketches

```ts
type User = {
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

type QuestCatalogItem = {
	id: number;
	title: string;
	description: string;
	toughness: number;
	statFocus: "strength" | "agility" | "intelligence";
};

type WeeklyQuest = {
	id: number;
	userId: string;
	weekStart: string;
	slot: number;
	status: "assigned" | "submitted" | "verified" | "rejected";
	proofDescription: string | null;
	proofUrl: string | null;
	submittedAt: string | null;
	verifiedAt: string | null;
	createdAt: string;
	quest: QuestCatalogItem;
};
```

---

## 11) Implementation order (fastest dynamic loop)

1. `POST /api/users`
2. `GET /api/quests/weekly/:userId`
3. `POST /api/quests/weekly/:userId/reroll`
4. `POST /api/uploads/proof-photo`
5. `POST /api/quests/weekly/:weeklyQuestId/proof`
6. `GET /api/verification/assignments/:voterUserId`
7. `POST /api/verification/jobs/:jobId/vote`
8. `GET /api/onboarding/me` + `PUT /api/onboarding/me`

This sequence enables: **sign in → receive quests → submit proof → community verification → stats/streak updates**.
