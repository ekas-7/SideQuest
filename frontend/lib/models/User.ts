import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  username: string;
  trustScore: number;
  streak: number;
  xp: number;
  strength: number;
  agility: number;
  intelligence: number;
  onboardingCompleted: boolean;
  onboardingInterests: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, trim: true },
    trustScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    strength: { type: Number, default: 0 },
    agility: { type: Number, default: 0 },
    intelligence: { type: Number, default: 0 },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingInterests: { type: [String], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ xp: -1 });
UserSchema.index({ trustScore: -1 });
UserSchema.index({ streak: -1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
