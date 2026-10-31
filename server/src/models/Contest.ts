import mongoose, { Document, Schema } from 'mongoose';
import { CONTEST_STATES, ContestState, SCORING_MODES, ScoringMode } from '@dagna/shared';

export interface IContestProblemRef {
  problemId: mongoose.Types.ObjectId;
  label: string; // 'A', 'B', 'C', etc.
  points?: number;
}

export interface IContest extends Document {
  title: string;
  description: string;
  visibility: 'public' | 'group' | 'unlisted';
  groupId?: mongoose.Types.ObjectId;
  mode: ScoringMode;
  startAt: Date;
  endAt: Date;
  freezeAt?: Date;
  penaltyMinutes: number;
  rated: boolean;
  state: ContestState;
  problems: IContestProblemRef[];
  showVerdictsDuringContest: boolean;
  isScoreboardFrozen: boolean;
  participantCount: number;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContestSchema = new Schema<IContest>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'group', 'unlisted'],
      default: 'public',
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    mode: {
      type: String,
      enum: Object.values(SCORING_MODES),
      default: SCORING_MODES.ICPC,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    freezeAt: {
      type: Date,
    },
    penaltyMinutes: {
      type: Number,
      default: 20,
    },
    rated: {
      type: Boolean,
      default: false,
    },
    state: {
      type: String,
      enum: Object.values(CONTEST_STATES),
      default: CONTEST_STATES.DRAFT,
      index: true,
    },
    problems: [
      {
        problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
        label: { type: String, required: true },
        points: { type: Number, default: 100 },
      },
    ],
    showVerdictsDuringContest: {
      type: Boolean,
      default: true,
    },
    isScoreboardFrozen: {
      type: Boolean,
      default: false,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

ContestSchema.index({ state: 1, startAt: 1 });

export const Contest = mongoose.model<IContest>('Contest', ContestSchema);

export interface IRegistration extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  registeredAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
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
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

RegistrationSchema.index({ contestId: 1, userId: 1 }, { unique: true });

export const Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);
