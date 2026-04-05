import { Hono } from "hono";

import { castVoteController, listAssignmentsForVoterController } from "../controllers/verification.controller.ts";

export const verificationRoutes = new Hono();

verificationRoutes.post("/jobs/:jobId/vote", castVoteController);
verificationRoutes.get("/assignments/:voterUserId", listAssignmentsForVoterController);
