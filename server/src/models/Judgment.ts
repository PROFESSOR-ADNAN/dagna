import mongoose, { Document, Schema } from 'mongoose';
import { VERDICTS, Verdict } from '@dagna/shared';

export interface IJudgment extends Document {
  submissionId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  generation: number;
  nodeId: string;
  toolchainDigest?: string;
  compile: {
    ok: boolean;
    output: string; // Truncated to 4 KB with paths scrubbed
  };
  verdict: Verdict;
  score: number;
  maxTimeMs: number;
  maxMemoryKB: number;
  failedTest?: number;
  isCurrent: boolean;
  createdAt: Date;
}

const JudgmentSchema = new Schema<IJudgment>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JudgeJob',
      required: true,
    },
    generation: {
      type: Number,
      required: true,
    },
    nodeId: {
      type: String,
      required: true,
    },
    toolchainDigest: {
      type: String,
    },
    compile: {
      ok: { type: Boolean, required: true },
      output: { type: String, default: '' },
    },
    verdict: {
      type: String,
      enum: Object.values(VERDICTS),
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    maxTimeMs: {
      type: Number,
      default: 0,
    },
    maxMemoryKB: {
      type: Number,
      default: 0,
    },
    failedTest: {
      type: Number,
    },
    isCurrent: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

JudgmentSchema.index({ submissionId: 1, isCurrent: 1 });

export const Judgment = mongoose.model<IJudgment>('Judgment', JudgmentSchema);
