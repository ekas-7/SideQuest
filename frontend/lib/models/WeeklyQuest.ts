import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type WeeklyQuestStatus = "assigned" | "submitted" | "verified" | "rejected";

export interface IWeeklyQuest extends Document {
  userId: string;
  questId: Types.ObjectId;
  weekStart: string;
  slot: number;
  status: WeeklyQuestStatus;
  proofDescription: string | null;
  proofUrl: string | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  rerollUsed: boolean;
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyQuestSchema = new Schema<IWeeklyQuest>(
  {
    userId: { type: String, required: true, index: true },
    questId: { type: Schema.Types.ObjectId, ref: "QuestCatalog", required: true },
    weekStart: { type: String, required: true },
    slot: { type: Number, required: true, min: 0, max: 2 },
    status: {
      type: String,
      required: true,
      enum: ["assigned", "submitted", "verified", "rejected"],
      default: "assigned",
    },
    proofDescription: { type: String, default: null },
    proofUrl: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    rerollUsed: { type: Boolean, default: false },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WeeklyQuestSchema.index({ userId: 1, weekStart: 1 });

export const WeeklyQuest: Model<IWeeklyQuest> =
  mongoose.models.WeeklyQuest ??
  mongoose.model<IWeeklyQuest>("WeeklyQuest", WeeklyQuestSchema);
