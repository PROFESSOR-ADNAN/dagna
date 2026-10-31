import mongoose, { Document, Schema } from 'mongoose';
import { SCORING_MODES, ScoringMode } from '@dagna/shared';

export interface ITestMeta {
  index: number;
  inputHash: string;
  answerHash: string;
  group?: number;
  points?: number;
  isSample: boolean;
}

export interface ISample {
  input: string;
  output: string;
  explanation?: string;
}

export interface IProblemVersion extends Document {
  problemId: mongoose.Types.ObjectId;
  version: number;
  packageHash: string;
  statements: {
    en: { title: string; description: string; inputFormat: string; outputFormat: string; notes?: string };
    am?: { title: string; description: string; inputFormat: string; outputFormat: string; notes?: string };
  };
  samples: ISample[];
  limits: {
    cpuTimeMs: number;
    memoryLimitMB: number;
    outputLimitBytes: number;
    sourceLimitBytes: number;
  };
  scoring: {
    mode: ScoringMode;
    groups?: Array<{ id: number; points: number; dependencies?: number[] }>;
  };
  tests: ITestMeta[];
  checker: {
    type: 'exact' | 'lines' | 'tokens' | 'float' | 'custom';
    sourceHash?: string;
    language?: string;
    epsilon?: number;
  };
  validationReport?: Record<string, unknown>;
  createdAt: Date;
}

const ProblemVersionSchema = new Schema<IProblemVersion>(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    packageHash: {
      type: String,
      required: true,
    },
    statements: {
      type: Schema.Types.Mixed,
      required: true,
    },
    samples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    limits: {
      cpuTimeMs: { type: Number, default: 1000 },
      memoryLimitMB: { type: Number, default: 256 },
      outputLimitBytes: { type: Number, default: 16 * 1024 * 1024 },
      sourceLimitBytes: { type: Number, default: 64 * 1024 },
    },
    scoring: {
      mode: { type: String, enum: Object.values(SCORING_MODES), default: SCORING_MODES.ICPC },
      groups: [
        {
          id: Number,
          points: Number,
          dependencies: [Number],
        },
      ],
    },
    tests: [
      {
        index: Number,
        inputHash: String,
        answerHash: String,
        group: Number,
        points: Number,
        isSample: Boolean,
      },
    ],
    checker: {
      type: { type: String, enum: ['exact', 'lines', 'tokens', 'float', 'custom'], default: 'tokens' },
      sourceHash: String,
      language: String,
      epsilon: Number,
    },
    validationReport: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ProblemVersionSchema.index({ problemId: 1, version: 1 }, { unique: true });

export const ProblemVersion = mongoose.model<IProblemVersion>('ProblemVersion', ProblemVersionSchema);
