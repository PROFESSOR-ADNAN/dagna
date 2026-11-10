import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'pending' | 'success' | 'failed';
export type PaymentPurpose = 'contest_fee' | 'donation' | 'subscription';

export interface IPayment extends Document {
  txRef: string;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  email: string;
  firstName?: string;
  lastName?: string;
  title: string;
  description?: string;
  purpose: PaymentPurpose;
  contestId?: mongoose.Types.ObjectId;
  status: PaymentStatus;
  chapaCheckoutUrl?: string;
  chapaReference?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    txRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'ETB',
      uppercase: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['contest_fee', 'donation', 'subscription'],
      default: 'contest_fee',
    },
    contestId: {
      type: Schema.Types.ObjectId,
      ref: 'Contest',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    chapaCheckoutUrl: {
      type: String,
    },
    chapaReference: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
