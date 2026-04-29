/**
 * Seed the QuestCatalog collection in MongoDB.
 *
 * Usage (from the frontend/ directory):
 *   npx tsx scripts/seed-quests.ts
 *
 * Requires MONGODB_URI to be set in .env.local
 */

import "dotenv/config";
import path from "path";
import { readFileSync } from "fs";
import mongoose from "mongoose";
import { QuestCatalog } from "../lib/models/QuestCatalog";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found. Add it to .env.local");
  process.exit(1);
}

const catalogPath = path.join(process.cwd(), "data", "quest-catalog.json");
const quests = JSON.parse(readFileSync(catalogPath, "utf-8")) as Array<{
  title: string;
  description: string;
  toughness: number;
  statFocus: "strength" | "agility" | "intelligence";
  categories: string[];
}>;

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected to MongoDB");

  const existing = await QuestCatalog.countDocuments();
  if (existing > 0) {
    console.log(`ℹ️   QuestCatalog already has ${existing} documents.`);
    const answer = process.argv.includes("--force") ? "y" : null;
    if (!answer) {
      console.log(
        "   Pass --force to wipe and re-seed, or skip if already seeded."
      );
      await mongoose.disconnect();
      return;
    }
    await QuestCatalog.deleteMany({});
    console.log("🗑️   Wiped existing catalog.");
  }

  const result = await QuestCatalog.insertMany(quests);
  console.log(`🌱  Seeded ${result.length} quests into QuestCatalog.`);

  await mongoose.disconnect();
  console.log("✅  Done.");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
