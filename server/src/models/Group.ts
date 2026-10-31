import mongoose, { Document, Schema } from 'mongoose';
import { GROUP_ROLES, GroupRole } from '@dagna/shared';

export interface IGroup extends Document {
  name: string;
  slug: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const Group = mongoose.model<IGroup>('Group', GroupSchema);

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: GroupRole;
  joinedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: Object.values(GROUP_ROLES),
    default: GROUP_ROLES.MEMBER,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const GroupMember = mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);

export interface IGroupInvite extends Document {
  groupId: mongoose.Types.ObjectId;
  code: string;
  createdById: mongoose.Types.ObjectId;
  usesRemaining: number;
  expiresAt: Date;
}

const GroupInviteSchema = new Schema<IGroupInvite>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdById: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  usesRemaining: {
    type: Number,
    default: 10,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

export const GroupInvite = mongoose.model<IGroupInvite>('GroupInvite', GroupInviteSchema);
