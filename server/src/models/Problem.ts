import mongoose, { Document, Schema } from 'mongoose';

export interface IProblem extends Document {
  slug: string;
  title: string;
  authorId: mongoose.Types.ObjectId;
  currentVersionId?: mongoose.Types.ObjectId;
  visibility: 'draft' | 'contest_only' | 'public' | 'archived';
  tags: string[];
  difficulty: number;
  source: string;
  license: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProblemSchema = new Schema<IProblem>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProblemVersion',
    },
    visibility: {
      type: String,
      enum: ['draft', 'contest_only', 'public', 'archived'],
      default: 'draft',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    difficulty: {
      type: Number,
      default: 1200,
      index: true,
    },
    source: {
      type: String,
      default: 'Original',
    },
    license: {
      type: String,
      default: 'CC-BY-4.0',
    },
  },
  { timestamps: true }
);

ProblemSchema.index({ visibility: 1, difficulty: 1 });

export const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);
