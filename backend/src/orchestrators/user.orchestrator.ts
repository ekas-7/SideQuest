import { HttpError } from "../utils/http-error.ts";
import * as userService from "../services/user.service.ts";

export const registerUser = async (username: string) => {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    throw new HttpError(400, "Username is required.");
  }

  try {
    return await userService.createUser(normalized);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new HttpError(409, "Username already exists.");
    }
    throw error;
  }
};
