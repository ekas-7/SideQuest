/**
 * One-time database seed route.
 * Call once after deployment: POST /api/seed  with header  x-seed-token: <SEED_SECRET>
 * Set SEED_SECRET in your environment variables.
 */
import { connectToDatabase } from "@/lib/mongodb";
import { QuestCatalog } from "@/lib/models/QuestCatalog";
import { serverErrorResponse } from "@/lib/server-auth";
import questCatalog from "@/data/quest-catalog.json";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = request.headers.get("x-seed-token");
  const secret = process.env.SEED_SECRET;

  if (!secret) {
    return Response.json(
      { error: "SEED_SECRET env var not set" },
      { status: 500 }
    );
  }

  if (token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const existing = await QuestCatalog.countDocuments();
    const force = new URL(request.url).searchParams.get("force") === "true";

    if (existing > 0 && !force) {
      return Response.json({
        message: `Already seeded (${existing} quests). Add ?force=true to re-seed.`,
        count: existing,
      });
    }

    if (force) {
      await QuestCatalog.deleteMany({});
    }

    const result = await QuestCatalog.insertMany(questCatalog);

    return Response.json({
      message: `Seeded ${result.length} quests successfully.`,
      count: result.length,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
