import { mkdir } from "node:fs/promises";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { serve } from "bun";

import { errorMiddleware } from "./src/middlewares/error.middleware.ts";
import { UPLOAD_DIR } from "./src/paths.ts";
import { questRoutes } from "./src/routes/quest.route.ts";
import { uploadRoutes } from "./src/routes/upload.route.ts";
import { userRoutes } from "./src/routes/user.route.ts";
import { verificationRoutes } from "./src/routes/verification.route.ts";

await mkdir(UPLOAD_DIR, { recursive: true });

const app = new Hono();

app.use("*", cors());

app.use(
	"/uploads/*",
	serveStatic({
		root: UPLOAD_DIR,
		rewriteRequestPath: (p) => p.replace(/^\/uploads\/?/, ""),
	}),
);

app.get("/health", (c) =>
	c.json({
		status: "ok",
		service: "sidequest-backend",
		timestamp: new Date().toISOString(),
	}),
);

app.route("/api/users", userRoutes);
app.route("/api/quests", questRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/verification", verificationRoutes);

app.onError(errorMiddleware);

const port = Number(process.env.PORT ?? 3001);

serve({
	fetch: app.fetch,
	port,
});

console.log(`🚀 SideQuest backend running on http://localhost:${port}`);