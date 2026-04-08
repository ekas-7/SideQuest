import type { PoolClient } from "../config/database.ts";
import {
  createUserRepo,
  getUserByClerkIdRepo,
  getUserByIdRepo,
  getUserByUsernameRepo,
  listUsersExcludingRepo,
  updateMeUsernameRepo,
} from "../repositories/user.repo.ts";

export const userService = {
  createUser: createUserRepo,
  getByClerkId: getUserByClerkIdRepo,
  getById: getUserByIdRepo,
  getByUsername: getUserByUsernameRepo,
  updateUsername: updateMeUsernameRepo,
  listUsersExcluding: listUsersExcludingRepo,
};

export type ServiceClient = PoolClient | undefined;
