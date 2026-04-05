import type { QueryExecutor } from "../config/database.ts";
import type { StatFocus } from "../models/user.model.ts";
import * as userRepo from "../repositories/user.repo.ts";

export const createUser = (username: string, executor?: QueryExecutor) => userRepo.createUser(username, executor);

export const getUserById = (userId: string, executor?: QueryExecutor) => userRepo.getUserById(userId, executor);

export const listRandomVoters = (excludeUserId: string, limit: number, executor?: QueryExecutor) =>
  userRepo.listRandomUsersExcluding(excludeUserId, limit, executor);

export const applyProgressForVerifiedQuest = (
  userId: string,
  xpGain: number,
  statFocus: StatFocus,
  statGain: number,
  executor?: QueryExecutor,
) => userRepo.applyProgressForVerifiedQuest(userId, xpGain, statFocus, statGain, executor);

export const applyTrustDelta = (userId: string, delta: number, executor?: QueryExecutor) =>
  userRepo.applyTrustDelta(userId, delta, executor);
