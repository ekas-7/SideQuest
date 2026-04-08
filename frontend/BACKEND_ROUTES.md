# SideQuest Backend Route Spec (for a fully dynamic app)

This document lists the backend routes needed to power the current frontend dynamically (quests, proof upload, verification voting, onboarding, profile stats, and app shell behavior).

Assumptions used:
- Clerk handles authentication, and backend trusts Clerk JWT/session.
- API base URL is configured via `NEXT_PUBLIC_API_BASE_URL`.
- Existing frontend types in `lib/api.ts` are the source of truth for initial payload shapes.

## 1) Health / Service

### `GET /health`
**What it does**
- Basic uptime check for frontend/API connectivity.

**Response (200)**
- `{ "status": "ok" }`

---

## 2) Auth + User Profile

### `POST /api/users`
**What it does**
- Creates a backend user profile after Clerk sign-in.
- Handles unique username collisions (returns conflict).

**Request body**
- `{ "username": string }`

**Response (201)**
- `{ "user": User }`

**Errors**
- `409` if username already exists.

### `GET /api/users/me`
**What it does**
- Returns the signed-in user profile by Clerk identity (no client-side localStorage dependency).

**Response (200)**
- `{ "user": User }`

### `PATCH /api/users/me`
**What it does**
- Updates editable profile fields (ex: username, display preferences).

**Request body (example)**
- `{ "username"?: string }`

**Response (200)**
- `{ "user": User }`

---

## 3) Onboarding (currently local-only, should be backend-backed)

### `GET /api/onboarding/me`
**What it does**
- Returns onboarding completion + selected interests + suggested side quests.

**Response (200)**
- `{ "completed": boolean, "interests": OnboardingInterest[], "suggestions": SuggestedSideQuest[] }`

### `PUT /api/onboarding/me`
**What it does**
- Saves onboarding interests and computes/stores suggestions server-side.

**Request body**
- `{ "interests": OnboardingInterest[] }`

**Response (200)**
- `{ "completed": boolean, "interests": OnboardingInterest[], "suggestions": SuggestedSideQuest[] }`

---

## 4) Quest Catalog + Weekly Assignment

### `GET /api/quests/catalog`
**What it does**
- Returns all quest templates/canonical catalog items.

**Response (200)**
- `{ "catalog": QuestCatalogItem[] }`

### `GET /api/quests/weekly/:userId?date=YYYY-MM-DD`
**What it does**
- Returns weekly quests for a user and week.
- If none assigned for that week, creates/assigns them.

**Response (200)**
- `WeeklyQuestsResponse`

### `POST /api/quests/weekly/:userId/reroll?date=YYYY-MM-DD`
**What it does**
- Re-rolls weekly quests (typically once per week).

**Response (200)**
- `WeeklyQuestsResponse`

**Errors**
- `409` if reroll already used.

### `GET /api/quests/weekly/:userId/history?limit=20&cursor=...`
**What it does**
- Returns completed/rejected/submitted quest history for profile pages and analytics.

**Response (200)**
- `{ "items": WeeklyQuest[], "nextCursor": string | null }`

---

## 5) Proof Upload + Submission

### `POST /api/uploads/proof-photo`
**What it does**
- Uploads proof image and returns public/protected URL.

**Request**
- `multipart/form-data` with `file`.

**Response (200)**
- `{ "url": string }`

### `POST /api/quests/weekly/:weeklyQuestId/proof`
**What it does**
- Submits proof for a weekly quest.
- Creates verification job and voter assignments.

**Request body**
- `{ "userId": string, "description": string, "proofUrl": string }`

**Response (200/201)**
- `SubmitProofResponse`

**Errors**
- `400` missing fields / invalid state.
- `403` user not owner of quest.

---

## 6) Verification Queue + Voting

### `GET /api/verification/assignments/:voterUserId`
**What it does**
- Returns voting cards assigned to a user.

**Response (200)**
- `{ "assignments": VerificationAssignment[] }`

### `POST /api/verification/jobs/:jobId/vote`
**What it does**
- Casts an approve/reject vote for one verification job.
- Finalizes job when vote threshold reached.

**Request body**
- `{ "voterUserId": string, "vote": boolean }`

**Response (200)**
- `CastVoteResponse` (`pending` or finalized `approved/rejected` shape)

### `GET /api/verification/jobs/:jobId`
**What it does**
- Returns current job tally/state for polling or post-vote refresh.

**Response (200)**
- `{ "job": { "id": number, "status": "pending" | "approved" | "rejected", "approvals": number, "rejections": number, "requiredVotes": number } }`

---

## 7) Dashboard / Progress Data (for profile + streak + stats)

### `GET /api/dashboard/:userId`
**What it does**
- Aggregated dashboard payload to reduce frontend round-trips.
- Includes user core stats + current weekly quests + pending verification count.

**Response (200)**
- `{ "user": User, "weekly": WeeklyQuestsResponse, "pendingVerification": number }`

### `GET /api/users/:userId/stats`
**What it does**
- Returns longitudinal stats (streak history, XP trend, trust score trend).

**Response (200)**
- `{ "streakHistory": Array<{ "date": string, "value": number }>, "xpHistory": Array<{ "date": string, "value": number }>, "trustHistory": Array<{ "date": string, "value": number }> }`

---

## 8) Optional but high-value routes

### `GET /api/leaderboard?window=weekly|all_time&limit=50`
**What it does**
- Community ranking by XP/trust/streak.

### `GET /api/notifications/me`
**What it does**
- Returns feed-style notifications (proof approved/rejected, streak milestones).

### `PATCH /api/notifications/:id/read`
**What it does**
- Marks one notification as read.

---

## Canonical Type Sketches

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

## Minimal implementation order (fastest path)

1. `POST /api/users`
2. `GET /api/quests/weekly/:userId`
3. `POST /api/quests/weekly/:userId/reroll`
4. `POST /api/uploads/proof-photo`
5. `POST /api/quests/weekly/:weeklyQuestId/proof`
6. `GET /api/verification/assignments/:voterUserId`
7. `POST /api/verification/jobs/:jobId/vote`
8. `GET /api/onboarding/me` + `PUT /api/onboarding/me`

That set makes the core SideQuest loop fully dynamic: **sign in → get quests → submit proof → community vote → update stats/streak**.
