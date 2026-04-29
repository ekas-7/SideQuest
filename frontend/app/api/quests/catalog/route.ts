import { connectToDatabase } from "@/lib/mongodb";
import { QuestCatalog } from "@/lib/models/QuestCatalog";
import { serializeQuestCatalogItem } from "@/lib/serializers";
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const catalog = await QuestCatalog.find({}).sort({ toughness: 1 }).lean();

    return Response.json({ catalog: catalog.map(serializeQuestCatalogItem) });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
