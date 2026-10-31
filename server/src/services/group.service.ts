import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Group, GroupMember, GroupInvite, IGroup } from '../models/Group.js';
import { AppError } from '../middleware/errorHandler.js';
import { GROUP_ROLES, GroupRole } from '@dagna/shared';

export class GroupService {
  static async createGroup(
    userId: string,
    data: { name: string; slug: string; description?: string }
  ): Promise<IGroup> {
    const existing = await Group.findOne({ slug: data.slug.toLowerCase() });
    if (existing) {
      throw new AppError('A group with this slug already exists', 409);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const group = new Group({
        name: data.name,
        slug: data.slug.toLowerCase(),
        description: data.description || '',
        ownerId: new mongoose.Types.ObjectId(userId),
        memberCount: 1,
      });
      await group.save({ session });

      await GroupMember.create(
        [
          {
            groupId: group._id,
            userId: new mongoose.Types.ObjectId(userId),
            role: GROUP_ROLES.OWNER,
          },
        ],
        { session }
      );

      // Generate initial invite code
      const initialCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      await GroupInvite.create(
        [
          {
            groupId: group._id,
            code: initialCode,
            createdById: new mongoose.Types.ObjectId(userId),
            usesRemaining: 50,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return group;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async joinByCode(userId: string, code: string): Promise<IGroup> {
    const invite = await GroupInvite.findOne({ code: code.trim().toUpperCase() });
    if (!invite || invite.usesRemaining <= 0 || invite.expiresAt < new Date()) {
      throw new AppError('Invite code is invalid, depleted, or expired', 400);
    }

    const alreadyMember = await GroupMember.findOne({
      groupId: invite.groupId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (alreadyMember) {
      throw new AppError('You are already a member of this group', 400);
    }

    const group = await Group.findById(invite.groupId);
    if (!group) {
      throw new AppError('Group no longer exists', 404);
    }

    invite.usesRemaining -= 1;
    await invite.save();

    await GroupMember.create({
      groupId: group._id,
      userId: new mongoose.Types.ObjectId(userId),
      role: GROUP_ROLES.MEMBER,
    });

    group.memberCount += 1;
    await group.save();

    return group;
  }

  static async getGroupMembers(groupId: string): Promise<any[]> {
    return GroupMember.find({ groupId })
      .populate('userId', 'handle displayName rating')
      .sort({ role: 1, joinedAt: 1 });
  }

  static async createInvite(userId: string, groupId: string, uses = 10, daysValid = 7): Promise<string> {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

    await GroupInvite.create({
      groupId: new mongoose.Types.ObjectId(groupId),
      code,
      createdById: new mongoose.Types.ObjectId(userId),
      usesRemaining: uses,
      expiresAt,
    });

    return code;
  }
}
