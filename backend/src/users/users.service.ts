import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string) {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async getLeaderboard(limit = 100) {
    return this.userModel
      .find()
      .select('name email stats.solved stats.attempted stats.rating createdAt')
      .sort({ 'stats.solved': -1, 'stats.rating': -1, 'stats.attempted': 1 })
      .limit(limit)
      .exec();
  }

  async updateStats(
    userId: string,
    update: Partial<{ solved: number; attempted: number; weakTags: string[]; rating: number }>,
  ) {
    const set: Record<string, any> = {};
    if (update.solved !== undefined) set['stats.solved'] = update.solved;
    if (update.attempted !== undefined) set['stats.attempted'] = update.attempted;
    if (update.rating !== undefined) set['stats.rating'] = update.rating;
    if (update.weakTags !== undefined) set['stats.weakTags'] = update.weakTags;
    return this.userModel.findByIdAndUpdate(userId, { $set: set }, { new: true }).exec();
  }

  async addWeakTag(userId: string, tag: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { $addToSet: { 'stats.weakTags': tag } }, { new: true })
      .exec();
  }
}
