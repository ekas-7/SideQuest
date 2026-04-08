import app from "./src/app.ts";

const port = Number(process.env.PORT ?? 3001);

Bun.serve({
	port,
	fetch: app.fetch,
});

console.log(`SideQuest backend running on http://localhost:${port}`);
