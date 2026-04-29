import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStatsHistory extends Document {
  userId: string;
  date: string;
  streak: number;
  xp: number;
  trustScore: number;
  createdAt: Date;
}

const StatsHistorySchema = new Schema<IStatsHistory>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    streak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

StatsHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export const StatsHistory: Model<IStatsHistory> =
  mongoose.models.StatsHistory ??
  mongoose.model<IStatsHistory>("StatsHistory", StatsHistorySchema);
