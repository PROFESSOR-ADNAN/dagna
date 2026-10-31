import mongoose, { Document, Schema } from 'mongoose';

export interface IJudgeNode extends Document {
  nodeId: string;
  tokenHash: string;
  state: 'active' | 'draining' | 'quarantined' | 'revoked';
  version: string;
  toolchainDigests: Record<string, string>;
  calibrationScore: number;
  lastHeartbeat: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JudgeNodeSchema = new Schema<IJudgeNode>(
  {
    nodeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    state: {
      type: String,
      enum: ['active', 'draining', 'quarantined', 'revoked'],
      default: 'active',
      index: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    toolchainDigests: {
      type: Schema.Types.Mixed,
      default: {},
    },
    calibrationScore: {
      type: Number,
      default: 100,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

export const JudgeNode = mongoose.model<IJudgeNode>('JudgeNode', JudgeNodeSchema);
