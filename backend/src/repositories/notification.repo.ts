import type { PoolClient } from "../config/database.ts";
import { query } from "../config/database.ts";

export async function listNotificationsRepo(userId: string, client?: PoolClient) {
  const result = await query<{
    id: number;
    kind: string;
    message: string;
    is_read: boolean;
    created_at: Date;
  }>(
    `
      SELECT id, kind, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 100
    `,
    [userId],
    client,
  );

  return result.rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function markNotificationReadRepo(notificationId: number, userId: string, client?: PoolClient) {
  const result = await query<{ id: number }>(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [notificationId, userId],
    client,
  );

  return result.rows[0] ?? null;
}
