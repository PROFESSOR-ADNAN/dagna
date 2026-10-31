import mongoose, { Document, Schema } from 'mongoose';

export interface IOutbox extends Document {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  relayed: boolean;
  createdAt: Date;
}

const OutboxSchema = new Schema<IOutbox>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    relayed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

OutboxSchema.index({ relayed: 1, createdAt: 1 });

export const Outbox = mongoose.model<IOutbox>('Outbox', OutboxSchema);
