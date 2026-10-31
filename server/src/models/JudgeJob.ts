import mongoose, { Document, Schema } from 'mongoose';

export interface IJudgeJob extends Document {
  type: 'submission' | 'validation' | 'rejudge';
  refId: mongoose.Types.ObjectId; // Submission ID or Package ID
  priority: number; // 0 = Contest, 1 = Practice, 2 = Rejudge, 3 = Validation
  state: 'queued' | 'leased' | 'done' | 'failed';
  attempt: number;
  generation: number; // Monotonic fencing token
  leaseOwner?: string; // Node ID
  leaseExpiresAt?: Date;
  readyAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JudgeJobSchema = new Schema<IJudgeJob>(
  {
    type: {
      type: String,
      enum: ['submission', 'validation', 'rejudge'],
      required: true,
      index: true,
    },
    refId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 1,
      index: true,
    },
    state: {
      type: String,
      enum: ['queued', 'leased', 'done', 'failed'],
      default: 'queued',
      index: true,
    },
    attempt: {
      type: Number,
      default: 1,
    },
    generation: {
      type: Number,
      default: 1,
    },
    leaseOwner: {
      type: String,
    },
    leaseExpiresAt: {
      type: Date,
      index: true,
    },
    readyAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// High-performance atomic claim index
JudgeJobSchema.index({ state: 1, priority: 1, readyAt: 1 });

export const JudgeJob = mongoose.model<IJudgeJob>('JudgeJob', JudgeJobSchema);
