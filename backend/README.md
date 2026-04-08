# SideQuest Backend (Bun + TypeScript + PostgreSQL)

Implements the full SideQuest feature set with strict layered architecture:

`Route → Controller → Vali → Orchestrator → Service → Repository → Database`

## Features implemented

- Weekly assignment of **3 side quests** per user.
- Weekly cycle fixed from **Sunday → Saturday**.
- One-click weekly **reroll** (usable **once per week**).
- Proof submission with `description` and `proofUrl`.
- Verification fan-out to up to **9 users**.
- First **5 votes** determine decision.
- Trust score updates for voters:
	- voted with majority → `+1`
	- voted against majority → `-1`
- Verified quest rewards:
	- streak `+1`
	- xp based on toughness (`toughness * 100`)
	- stat gain based on quest focus (`+toughness`)

## Setup

1. Install dependencies:

	 ```bash
	 bun install
	 ```

2. Add `.env`:

	 ```env
	 DATABASE_URL=postgresql://user:password@localhost:5432/sidequest
	 PORT=3001
	 ```

3. Apply SQL migrations in order to your PostgreSQL DB:

	- `migrations/001_init.sql`
	- `migrations/002_users_schema_compat.sql` (required if you already had an older local DB)
	- `migrations/003_core_schema_compat.sql` (required if weekly/verification tables came from legacy schema names)

4. Start API:

	 ```bash
	 bun run dev
	 ```

## API

### Health

- `GET /health`

### Users

- `POST /api/users`
	- body: `{ "username": "alice" }`

### Quests

- `GET /api/quests/catalog`
- `GET /api/quests/weekly/:userId?date=YYYY-MM-DD`
- `POST /api/quests/weekly/:userId/reroll?date=YYYY-MM-DD`
- `POST /api/quests/weekly/:weeklyQuestId/proof`
	- body: `{ "userId": "...", "description": "...", "proofUrl": "..." }`

### Verification

- `GET /api/verification/assignments/:voterUserId`
- `POST /api/verification/jobs/:jobId/vote`
	- body: `{ "voterUserId": "...", "vote": true }`

## Quality checks

- Typecheck: `bun run typecheck`
- Tests: `bun run test`
