import mongoose, { Document, Schema } from 'mongoose';

export interface IClarification extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  problemLabel?: string;
  question: string;
  answer?: string;
  isPublic: boolean;
  answeredById?: mongoose.Types.ObjectId;
  answeredAt?: Date;
  createdAt: Date;
}

const ClarificationSchema = new Schema<IClarification>(
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
    },
    problemLabel: {
      type: String,
    },
    question: {
      type: String,
      required: true,
      maxlength: 1024,
    },
    answer: {
      type: String,
      maxlength: 2048,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    answeredById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    answeredAt: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ClarificationSchema.index({ contestId: 1, createdAt: -1 });

export const Clarification = mongoose.model<IClarification>('Clarification', ClarificationSchema);
