import mongoose, { Document, Schema } from 'mongoose';

export interface IRatingChange extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  runId: string;
  oldRating: number;
  newRating: number;
  delta: number;
  rank: number;
  seed: number;
  createdAt: Date;
}

const RatingChangeSchema = new Schema<IRatingChange>(
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
    runId: {
      type: String,
      required: true,
      index: true,
    },
    oldRating: {
      type: Number,
      required: true,
    },
    newRating: {
      type: Number,
      required: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    seed: {
      type: Number,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RatingChangeSchema.index({ contestId: 1, userId: 1 }, { unique: true });
RatingChangeSchema.index({ userId: 1, createdAt: 1 });

export const RatingChange = mongoose.model<IRatingChange>('RatingChange', RatingChangeSchema);

export interface IRatingRun extends Document {
  contestId: mongoose.Types.ObjectId;
  runId: string;
  participantCount: number;
  averageRating: number;
  createdAt: Date;
}

const RatingRunSchema = new Schema<IRatingRun>(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: 'Contest',
      required: true,
      index: true,
    },
    runId: {
      type: String,
      required: true,
      unique: true,
    },
    participantCount: {
      type: Number,
      required: true,
    },
    averageRating: {
      type: Number,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const RatingRun = mongoose.model<IRatingRun>('RatingRun', RatingRunSchema);
