import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type JobStatus = "pending" | "approved" | "rejected";

export interface IVerificationVote {
  voterUserId: string;
  vote: boolean;
  votedAt: Date;
}

export interface IVerificationJob extends Document {
  weeklyQuestId: Types.ObjectId;
  submitterUserId: string;
  status: JobStatus;
  approvals: number;
  rejections: number;
  requiredVotes: number;
  votes: IVerificationVote[];
  assignedVoterIds: string[];
  proofUrl: string;
  proofDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationVoteSchema = new Schema<IVerificationVote>(
  {
    voterUserId: { type: String, required: true },
    vote: { type: Boolean, required: true },
    votedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const VerificationJobSchema = new Schema<IVerificationJob>(
  {
    weeklyQuestId: {
      type: Schema.Types.ObjectId,
      ref: "WeeklyQuest",
      required: true,
      index: true,
    },
    submitterUserId: { type: String, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvals: { type: Number, default: 0 },
    rejections: { type: Number, default: 0 },
    requiredVotes: { type: Number, default: 3 },
    votes: { type: [VerificationVoteSchema], default: [] },
    assignedVoterIds: { type: [String], default: [] },
    proofUrl: { type: String, required: true },
    proofDescription: { type: String, required: true },
  },
  { timestamps: true }
);

export const VerificationJob: Model<IVerificationJob> =
  mongoose.models.VerificationJob ??
  mongoose.model<IVerificationJob>("VerificationJob", VerificationJobSchema);
