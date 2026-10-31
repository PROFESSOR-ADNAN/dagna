import mongoose, { Document, Schema } from 'mongoose';

export interface IStandingCell {
  problemLabel: string;
  attempts: number;
  solved: boolean;
  acceptedAtSeconds?: number;
  penaltyMinutes: number;
  bestScore: number;
  lastImprovementAtSeconds?: number;
  isPending: boolean; // Shown during scoreboard freeze
}

export interface IStanding extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  cells: Map<string, IStandingCell>;
  totalSolved: number;
  totalPenalty: number;
  totalPoints: number;
  lastAcceptedAtSeconds: number;
  lastImprovementAtSeconds: number;
  rankKey: string; // BigInt serialized as string for exact sorting
  rank: number;
  updatedAt: Date;
}

const StandingSchema = new Schema<IStanding>(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: 'Contest',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cells: {
      type: Map,
      of: new Schema<IStandingCell>(
        {
          problemLabel: { type: String, required: true },
          attempts: { type: Number, default: 0 },
          solved: { type: Boolean, default: false },
          acceptedAtSeconds: Number,
          penaltyMinutes: { type: Number, default: 0 },
          bestScore: { type: Number, default: 0 },
          lastImprovementAtSeconds: Number,
          isPending: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: {},
    },
    totalSolved: {
      type: Number,
      default: 0,
      index: true,
    },
    totalPenalty: {
      type: Number,
      default: 0,
      index: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      index: true,
    },
    lastAcceptedAtSeconds: {
      type: Number,
      default: 0,
    },
    lastImprovementAtSeconds: {
      type: Number,
      default: 0,
    },
    rankKey: {
      type: String,
      default: '0',
      index: true,
    },
    rank: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

StandingSchema.index({ contestId: 1, userId: 1 }, { unique: true });
StandingSchema.index({ contestId: 1, totalSolved: -1, totalPenalty: 1 });

export const Standing = mongoose.model<IStanding>('Standing', StandingSchema);
