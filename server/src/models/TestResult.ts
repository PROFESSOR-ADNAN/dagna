import mongoose, { Document, Schema } from 'mongoose';
import { VERDICTS, Verdict } from '@dagna/shared';

export interface ITestResult extends Document {
  judgmentId: mongoose.Types.ObjectId;
  testIndex: number;
  verdict: Verdict;
  timeMs: number;
  memoryKB: number;
  checkerMessage: string; // Truncated, hidden test details never shown to users
  createdAt: Date;
}

const TestResultSchema = new Schema<ITestResult>(
  {
    judgmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Judgment',
      required: true,
      index: true,
    },
    testIndex: {
      type: Number,
      required: true,
    },
    verdict: {
      type: String,
      enum: Object.values(VERDICTS),
      required: true,
    },
    timeMs: {
      type: Number,
      default: 0,
    },
    memoryKB: {
      type: Number,
      default: 0,
    },
    checkerMessage: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: '365d' }, // Retained for 1 year per retention specification
    },
  },
  { timestamps: false }
);

TestResultSchema.index({ judgmentId: 1, testIndex: 1 }, { unique: true });

export const TestResult = mongoose.model<ITestResult>('TestResult', TestResultSchema);
