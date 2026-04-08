import { notificationService } from "../services/notification.service.ts";
import { userService } from "../services/user.service.ts";
import { HttpError } from "../utils/http.ts";

export async function getNotificationsOrchestrator(clerkUserId: string) {
  const user = await userService.getByClerkId(clerkUserId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const notifications = await notificationService.listNotifications(user.id);
  return { notifications };
}

export async function markNotificationReadOrchestrator(clerkUserId: string, notificationId: number) {
  const user = await userService.getByClerkId(clerkUserId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const updated = await notificationService.markRead(notificationId, user.id);
  if (!updated) throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  return { id: notificationId, read: true };
}
