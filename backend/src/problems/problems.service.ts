import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Problem, ProblemDocument } from './problem.schema';
import { CreateProblemDto, UpdateProblemDto, ProblemQueryDto } from './dto/problem.dto';

@Injectable()
export class ProblemsService {
  constructor(@InjectModel(Problem.name) private problemModel: Model<ProblemDocument>) {}

  async create(dto: CreateProblemDto): Promise<Problem> {
    return this.problemModel.create(dto);
  }

  async findAll(query: ProblemQueryDto, isAdmin: boolean = false) {
    const { tag, difficulty, search, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {};
    if (!isAdmin) filter.isPublished = true;

    if (tag) filter.tags = tag;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [problems, total] = await Promise.all([
      this.problemModel
        .find(filter)
        .select('-testCases')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.problemModel.countDocuments(filter),
    ]);

    return {
      data: problems,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProblemDocument> {
    const problem = await this.problemModel.findById(id).exec();
    if (!problem) throw new NotFoundException(`Problem ${id} not found`);
    return problem;
  }

  async findBySlug(slug: string): Promise<ProblemDocument> {
    const problem = await this.problemModel.findOne({ slug }).exec();
    if (!problem) throw new NotFoundException(`Problem '${slug}' not found`);
    return problem;
  }

  async update(id: string, dto: UpdateProblemDto) {
    const problem = await this.problemModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!problem) throw new NotFoundException(`Problem ${id} not found`);
    return problem;
  }

  async delete(id: string) {
    const problem = await this.problemModel.findByIdAndDelete(id).exec();
    if (!problem) throw new NotFoundException(`Problem ${id} not found`);
    return { message: 'Deleted' };
  }

  async getTags(): Promise<string[]> {
    const result = await this.problemModel.distinct('tags').exec();
    return result.sort();
  }

  async findByTags(tags: string[], excludeId?: string) {
    const filter: Record<string, any> = { isPublished: true, tags: { $in: tags } };
    if (excludeId) filter._id = { $ne: excludeId };
    return this.problemModel.find(filter).select('-testCases').limit(10).exec();
  }
}
