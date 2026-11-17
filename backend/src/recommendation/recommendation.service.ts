import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument } from '../submissions/submission.schema';
import { Problem, ProblemDocument } from '../problems/problem.schema';
import { User, UserDocument } from '../users/user.schema';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(Problem.name) private problemModel: Model<ProblemDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getNextProblem(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return null;

    // Get solved problem IDs
    const solvedDocs = await this.submissionModel
      .find({ userId: new Types.ObjectId(userId), verdict: 'AC' })
      .distinct('problemId');

    const weakTags = user.stats?.weakTags || [];

    // Strategy: prefer problems with weak tags that haven't been solved
    let recommended: any;

    if (weakTags.length > 0) {
      recommended = await this.problemModel.findOne({
        isPublished: true,
        _id: { $nin: solvedDocs },
        tags: { $in: weakTags },
        difficulty: this.getTargetDifficulty(user.stats?.rating || 1000),
      }).exec();
    }

    // Fallback: find any unsolved problem
    if (!recommended) {
      recommended = await this.problemModel.findOne({
        isPublished: true,
        _id: { $nin: solvedDocs },
        difficulty: this.getTargetDifficulty(user.stats?.rating || 1000),
      }).exec();
    }

    // Last fallback: any problem
    if (!recommended) {
      recommended = await this.problemModel.findOne({
        isPublished: true,
        _id: { $nin: solvedDocs },
      }).exec();
    }

    return recommended;
  }

  async getUserStats(userId: string) {
    const [totalSubmissions, acSubmissions, distinctSolved] = await Promise.all([
      this.submissionModel.countDocuments({ userId: new Types.ObjectId(userId) }),
      this.submissionModel.countDocuments({ userId: new Types.ObjectId(userId), verdict: 'AC' }),
      this.submissionModel.distinct('problemId', { userId: new Types.ObjectId(userId), verdict: 'AC' }),
    ]);

    // Verdict breakdown
    const verdictAgg = await this.submissionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$verdict', count: { $sum: 1 } } },
    ]);

    const verdictMap: Record<string, number> = {};
    verdictAgg.forEach((v) => { verdictMap[v._id] = v.count; });

    // Tag performance
    const tagAgg = await this.submissionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'problem' } },
      { $unwind: '$problem' },
      { $unwind: '$problem.tags' },
      {
        $group: {
          _id: '$problem.tags',
          total: { $sum: 1 },
          ac: { $sum: { $cond: [{ $eq: ['$verdict', 'AC'] }, 1, 0] } },
        },
      },
      { $addFields: { rate: { $divide: ['$ac', '$total'] } } },
      { $sort: { rate: 1 } },
    ]);

    return {
      totalSubmissions,
      acSubmissions,
      solvedProblems: distinctSolved.length,
      verdictBreakdown: verdictMap,
      tagPerformance: tagAgg,
    };
  }

  private getTargetDifficulty(rating: number): string {
    if (rating < 1100) return 'Easy';
    if (rating < 1400) return 'Medium';
    return 'Hard';
  }
}
