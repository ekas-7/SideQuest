import { Hono } from "hono";

import { uploadProofPhotoController } from "../controllers/upload.controller.ts";

export const uploadRoutes = new Hono();

uploadRoutes.post("/proof-photo", uploadProofPhotoController);
