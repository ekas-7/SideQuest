import { runInTransaction } from "../config/database.ts";
import type { User } from "../models/types.ts";
import { userService } from "../services/user.service.ts";
import { HttpError } from "../utils/http.ts";

export async function createUserOrchestrator(clerkUserId: string, username: string): Promise<User> {
  return runInTransaction(async (client) => {
    const existingByClerk = await userService.getByClerkId(clerkUserId, client);
    if (existingByClerk) return existingByClerk;

    const existingByUsername = await userService.getByUsername(username, client);
    if (existingByUsername) {
      throw new HttpError(409, "USERNAME_CONFLICT", "Username already exists");
    }

    return userService.createUser(clerkUserId, username, client);
  });
}

export async function getMeOrchestrator(clerkUserId: string): Promise<User> {
  const user = await userService.getByClerkId(clerkUserId);
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User profile not found");
  }
  return user;
}

export async function updateMeOrchestrator(clerkUserId: string, username?: string): Promise<User> {
  return runInTransaction(async (client) => {
    const user = await userService.getByClerkId(clerkUserId, client);
    if (!user) {
      throw new HttpError(404, "USER_NOT_FOUND", "User profile not found");
    }

    if (!username || username === user.username) {
      return user;
    }

    const existingByUsername = await userService.getByUsername(username, client);
    if (existingByUsername && existingByUsername.id !== user.id) {
      throw new HttpError(409, "USERNAME_CONFLICT", "Username already exists");
    }

    return userService.updateUsername(user.id, username, client);
  });
}
