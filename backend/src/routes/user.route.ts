import { Hono } from "hono";

import { createUserController } from "../controllers/user.controller.ts";

export const userRoutes = new Hono();

userRoutes.post("/", createUserController);
