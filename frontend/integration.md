# SideQuest Backend Integration Guide

This guide gives you a copy-paste path to run and integrate the new backend.

## 1) Prerequisites

- Bun installed
- PostgreSQL running
- A database created (example: `sidequest`)

## 2) Environment

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sidequest
PORT=3001
```

## 3) Install and migrate

From `backend/`:

```bash
bun install
psql "$DATABASE_URL" -f migrations/001_init.sql
```

## 4) Run backend

```bash
bun run dev
```

Health check:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{"data":{"status":"ok"},"error":null}
```

## 5) Auth behavior used right now

For now, protected routes require this header:

- `x-clerk-user-id: <your-clerk-user-id>`

Example:

```bash
-H 'x-clerk-user-id: clerk_test_user_1'
```

## 6) Quick integration flow (copy-paste)

### 6.1 Create user profile

```bash
curl -X POST http://localhost:3001/api/users \
  -H 'Content-Type: application/json' \
  -H 'x-clerk-user-id: clerk_test_user_1' \
  -d '{"username":"alice"}'
```

### 6.2 Get current user

```bash
curl http://localhost:3001/api/users/me \
  -H 'x-clerk-user-id: clerk_test_user_1'
```

### 6.3 Get quest catalog

```bash
curl http://localhost:3001/api/quests/catalog \
  -H 'x-clerk-user-id: clerk_test_user_1'
```

### 6.4 Get weekly quests

```bash
curl http://localhost:3001/api/quests/weekly/<USER_ID> \
  -H 'x-clerk-user-id: clerk_test_user_1'
```

### 6.5 Reroll weekly quests

```bash
curl -X POST http://localhost:3001/api/quests/weekly/<USER_ID>/reroll \
  -H 'x-clerk-user-id: clerk_test_user_1'
```

### 6.6 Submit proof

```bash
curl -X POST http://localhost:3001/api/quests/weekly/<WEEKLY_QUEST_ID>/proof \
  -H 'Content-Type: application/json' \
  -H 'x-clerk-user-id: clerk_test_user_1' \
  -d '{"userId":"<USER_ID>","description":"Completed challenge with photo","proofUrl":"https://example.com/proof.jpg"}'
```

### 6.7 Get voter assignments

```bash
curl http://localhost:3001/api/verification/assignments/<VOTER_USER_ID> \
  -H 'x-clerk-user-id: clerk_test_user_2'
```

### 6.8 Cast vote

```bash
curl -X POST http://localhost:3001/api/verification/jobs/<JOB_ID>/vote \
  -H 'Content-Type: application/json' \
  -H 'x-clerk-user-id: clerk_test_user_2' \
  -d '{"voterUserId":"<VOTER_USER_ID>","vote":true}'
```

## 7) Frontend integration notes

Set frontend env:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Current backend auth expects `x-clerk-user-id` for protected routes. If your frontend uses Clerk JWTs, add a backend JWT middleware next and switch the frontend to bearer token calls.

## 8) Quality checks

From `backend/`:

```bash
bun run typecheck
bun run test
```
