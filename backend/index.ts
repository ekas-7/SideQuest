import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "bun";

import { errorMiddleware } from "./src/middlewares/error.middleware.ts";
import { userRoutes } from "./src/routes/user.route.ts";
import { questRoutes } from "./src/routes/quest.route.ts";
import { verificationRoutes } from "./src/routes/verification.route.ts";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) =>
	c.json({
		status: "ok",
		service: "sidequest-backend",
		timestamp: new Date().toISOString(),
	}),
);

app.route("/api/users", userRoutes);
app.route("/api/quests", questRoutes);
app.route("/api/verification", verificationRoutes);

app.onError(errorMiddleware);

const port = Number(process.env.PORT ?? 3001);

serve({
	fetch: app.fetch,
	port,
});

console.log(`🚀 SideQuest backend running on http://localhost:${port}`);