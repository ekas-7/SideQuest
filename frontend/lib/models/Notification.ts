import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "proof_approved"
  | "proof_rejected"
  | "streak_milestone"
  | "xp_gained"
  | "level_up";

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        "proof_approved",
        "proof_rejected",
        "streak_milestone",
        "xp_gained",
        "level_up",
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);
