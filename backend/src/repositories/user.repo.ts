import type { PoolClient } from "../config/database.ts";
import { query } from "../config/database.ts";
import type { User } from "../models/types.ts";

type UserRow = {
  id: string;
  clerk_id: string;
  username: string;
  trust_score: number;
  streak: number;
  xp: number;
  strength: number;
  agility: number;
  intelligence: number;
  created_at: Date;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    username: row.username,
    trustScore: row.trust_score,
    streak: row.streak,
    xp: row.xp,
    strength: row.strength,
    agility: row.agility,
    intelligence: row.intelligence,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createUserRepo(
  clerkId: string,
  username: string,
  client?: PoolClient,
): Promise<User> {
  const result = await query<UserRow>(
    `
      INSERT INTO users (clerk_id, username)
      VALUES ($1, $2)
      RETURNING id, clerk_id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
    `,
    [clerkId, username],
    client,
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create user");
  }

  return toUser(row);
}

export async function getUserByClerkIdRepo(clerkId: string, client?: PoolClient): Promise<User | null> {
  const result = await query<UserRow>(
    `
      SELECT id, clerk_id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
      FROM users
      WHERE clerk_id = $1
      LIMIT 1
    `,
    [clerkId],
    client,
  );

  return result.rows[0] ? toUser(result.rows[0]) : null;
}

export async function getUserByIdRepo(userId: string, client?: PoolClient): Promise<User | null> {
  const result = await query<UserRow>(
    `
      SELECT id, clerk_id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
    client,
  );

  return result.rows[0] ? toUser(result.rows[0]) : null;
}

export async function getUserByUsernameRepo(username: string, client?: PoolClient): Promise<User | null> {
  const result = await query<UserRow>(
    `
      SELECT id, clerk_id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
      FROM users
      WHERE username = $1
      LIMIT 1
    `,
    [username],
    client,
  );

  return result.rows[0] ? toUser(result.rows[0]) : null;
}

export async function updateMeUsernameRepo(userId: string, username: string, client?: PoolClient): Promise<User> {
  const result = await query<UserRow>(
    `
      UPDATE users
      SET username = $2
      WHERE id = $1
      RETURNING id, clerk_id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
    `,
    [userId, username],
    client,
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to update username");
  }

  return toUser(row);
}

export async function listUsersExcludingRepo(userId: string, limit: number, client?: PoolClient): Promise<string[]> {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE id <> $1
      ORDER BY random()
      LIMIT $2
    `,
    [userId, limit],
    client,
  );

  return result.rows.map((r) => r.id);
}
