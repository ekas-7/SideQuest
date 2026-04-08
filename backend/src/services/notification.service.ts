import { listNotificationsRepo, markNotificationReadRepo } from "../repositories/notification.repo.ts";

export const notificationService = {
  listNotifications: listNotificationsRepo,
  markRead: markNotificationReadRepo,
};
