import type { QueryResultRow } from "pg";

import type { User, StatFocus } from "../models/user.model.ts";
import { type QueryExecutor, db } from "../config/database.ts";

interface UserRow extends QueryResultRow {
  id: string;
  username: string;
  trust_score: number;
  streak: number;
  xp: number;
  strength: number;
  agility: number;
  intelligence: number;
  created_at: string;
}

const mapUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  trustScore: row.trust_score,
  streak: row.streak,
  xp: row.xp,
  strength: row.strength,
  agility: row.agility,
  intelligence: row.intelligence,
  createdAt: row.created_at,
});

export const createUser = async (username: string, executor: QueryExecutor = db): Promise<User> => {
  const id = crypto.randomUUID();
  const { rows } = await executor.query<UserRow>(
    `
      INSERT INTO users (id, username)
      VALUES ($1, $2)
      RETURNING id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
    `,
    [id, username],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to create user.");
  }

  return mapUser(row);
};

export const getUserById = async (id: string, executor: QueryExecutor = db): Promise<User | null> => {
  const { rows } = await executor.query<UserRow>(
    `
      SELECT id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
      FROM users
      WHERE id = $1
    `,
    [id],
  );

  return rows[0] ? mapUser(rows[0]) : null;
};

export const listRandomUsersExcluding = async (
  excludeUserId: string,
  limit: number,
  executor: QueryExecutor = db,
): Promise<User[]> => {
  const { rows } = await executor.query<UserRow>(
    `
      SELECT id, username, trust_score, streak, xp, strength, agility, intelligence, created_at
      FROM users
      WHERE id <> $1
      ORDER BY RANDOM()
      LIMIT $2
    `,
    [excludeUserId, limit],
  );

  return rows.map(mapUser);
};

export const applyProgressForVerifiedQuest = async (
  userId: string,
  xpGain: number,
  statFocus: StatFocus,
  statGain: number,
  executor: QueryExecutor = db,
): Promise<void> => {
  const column = statFocus === "intelligence" ? "intelligence" : statFocus;
  await executor.query(
    `
      UPDATE users
      SET
        xp = xp + $2,
        streak = streak + 1,
        ${column} = ${column} + $3
      WHERE id = $1
    `,
    [userId, xpGain, statGain],
  );
};

export const applyTrustDelta = async (
  userId: string,
  delta: number,
  executor: QueryExecutor = db,
): Promise<void> => {
  await executor.query(
    `
      UPDATE users
      SET trust_score = trust_score + $2
      WHERE id = $1
    `,
    [userId, delta],
  );
};
