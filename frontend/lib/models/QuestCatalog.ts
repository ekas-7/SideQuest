import mongoose, { Schema, Document, Model } from "mongoose";

export type StatFocus = "strength" | "agility" | "intelligence";

export interface IQuestCatalog extends Document {
  title: string;
  description: string;
  toughness: number;
  statFocus: StatFocus;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestCatalogSchema = new Schema<IQuestCatalog>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    toughness: { type: Number, required: true, min: 1, max: 10 },
    statFocus: {
      type: String,
      required: true,
      enum: ["strength", "agility", "intelligence"],
    },
    categories: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const QuestCatalog: Model<IQuestCatalog> =
  mongoose.models.QuestCatalog ??
  mongoose.model<IQuestCatalog>("QuestCatalog", QuestCatalogSchema);
