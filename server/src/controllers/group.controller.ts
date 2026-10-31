import { Response, NextFunction } from 'express';
import { GroupService } from '../services/group.service.js';
import { Group } from '../models/Group.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export class GroupController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug, description } = req.body;
      if (!name || !slug) {
        throw new AppError('Name and slug are required fields', 400);
      }

      const group = await GroupService.createGroup(req.userId!, { name, slug, description });
      res.status(201).json({ success: true, group });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const groups = await Group.find()
        .populate('ownerId', 'handle displayName')
        .sort({ memberCount: -1 })
        .limit(50);

      res.status(200).json({ success: true, groups });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const group = await Group.findById(id).populate('ownerId', 'handle displayName');
      if (!group) {
        throw new AppError('Group not found', 404);
      }
      res.status(200).json({ success: true, group });
    } catch (err) {
      next(err);
    }
  }

  static async join(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) {
        throw new AppError('Invite code is required', 400);
      }

      const group = await GroupService.joinByCode(req.userId!, code);
      res.status(200).json({ success: true, message: `Successfully joined ${group.name}`, group });
    } catch (err) {
      next(err);
    }
  }

  static async getMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const members = await GroupService.getGroupMembers(id);
      res.status(200).json({ success: true, members });
    } catch (err) {
      next(err);
    }
  }

  static async createInvite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { uses, daysValid } = req.body;
      const code = await GroupService.createInvite(req.userId!, id, uses, daysValid);
      res.status(201).json({ success: true, code });
    } catch (err) {
      next(err);
    }
  }
}
