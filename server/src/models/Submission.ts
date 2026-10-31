import mongoose, { Document, Schema } from 'mongoose';
import {
  SUBMISSION_STATES,
  SubmissionState,
  VERDICTS,
  Verdict,
  LANGUAGES,
  SupportedLanguage,
} from '@dagna/shared';

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  problemId: mongoose.Types.ObjectId;
  problemVersionId: mongoose.Types.ObjectId;
  contestId?: mongoose.Types.ObjectId;
  language: SupportedLanguage;
  source: string;
  sourceHash: string;
  clientSubmissionId: string;
  receivedAt: Date;
  contestTimeSeconds?: number;
  state: SubmissionState;
  latestJudgmentId?: mongoose.Types.ObjectId;
  verdict?: Verdict;
  score: number;
  timeMs: number;
  memoryKB: number;
  failedTest?: number;
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    problemVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProblemVersion',
      required: true,
    },
    contestId: {
      type: Schema.Types.ObjectId,
      ref: 'Contest',
      index: true,
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      required: true,
    },
    source: {
      type: String,
      required: true,
      maxlength: 64 * 1024,
    },
    sourceHash: {
      type: String,
      required: true,
      index: true,
    },
    clientSubmissionId: {
      type: String,
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    contestTimeSeconds: {
      type: Number,
    },
    state: {
      type: String,
      enum: Object.values(SUBMISSION_STATES),
      default: SUBMISSION_STATES.QUEUED,
      index: true,
    },
    latestJudgmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Judgment',
    },
    verdict: {
      type: String,
      enum: Object.values(VERDICTS),
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    timeMs: {
      type: Number,
      default: 0,
    },
    memoryKB: {
      type: Number,
      default: 0,
    },
    failedTest: {
      type: Number,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Idempotency constraint: 1 submission per clientSubmissionId per user
SubmissionSchema.index({ userId: 1, clientSubmissionId: 1 }, { unique: true });

// Contest query compound index
SubmissionSchema.index({ contestId: 1, userId: 1, problemId: 1, receivedAt: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
