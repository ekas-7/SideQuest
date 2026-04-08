import { asIntParam } from "./common.vali.ts";

export function validateNotificationId(notificationId: string) {
  return asIntParam(notificationId, "notificationId");
}
