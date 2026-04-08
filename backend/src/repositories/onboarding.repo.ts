import type { PoolClient } from "../config/database.ts";
import { query } from "../config/database.ts";

export type OnboardingState = {
  completed: boolean;
  interests: string[];
  suggestions: { title: string; description: string }[];
};

export async function getOnboardingRepo(userId: string, client?: PoolClient): Promise<OnboardingState> {
  const state = await query<{ completed: boolean; interests: string[] }>(
    `
      SELECT completed, interests
      FROM onboarding
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
    client,
  );

  const suggestions = await query<{ title: string; description: string }>(
    `
      SELECT title, description
      FROM onboarding_suggestions
      WHERE user_id = $1
      ORDER BY id ASC
    `,
    [userId],
    client,
  );

  return {
    completed: state.rows[0]?.completed ?? false,
    interests: state.rows[0]?.interests ?? [],
    suggestions: suggestions.rows,
  };
}

export async function upsertOnboardingRepo(
  userId: string,
  interests: string[],
  suggestions: { title: string; description: string }[],
  client?: PoolClient,
): Promise<OnboardingState> {
  await query(
    `
      INSERT INTO onboarding (user_id, completed, interests)
      VALUES ($1, TRUE, $2::jsonb)
      ON CONFLICT (user_id)
      DO UPDATE SET completed = TRUE, interests = EXCLUDED.interests
    `,
    [userId, JSON.stringify(interests)],
    client,
  );

  await query(`DELETE FROM onboarding_suggestions WHERE user_id = $1`, [userId], client);

  for (const suggestion of suggestions) {
    await query(
      `
        INSERT INTO onboarding_suggestions (user_id, title, description)
        VALUES ($1, $2, $3)
      `,
      [userId, suggestion.title, suggestion.description],
      client,
    );
  }

  return {
    completed: true,
    interests,
    suggestions,
  };
}
