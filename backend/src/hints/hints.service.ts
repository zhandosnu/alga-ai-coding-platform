import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hint, HintDocument } from './hint.schema';
import { Problem, ProblemDocument } from '../problems/problem.schema';
import { AiClientService } from './ai-client.service';
import { RequestHintDto } from './dto/hint.dto';

@Injectable()
export class HintsService {
  constructor(
    @InjectModel(Hint.name) private hintModel: Model<HintDocument>,
    @InjectModel(Problem.name) private problemModel: Model<ProblemDocument>,
    private aiClient: AiClientService,
  ) {}

  async requestHint(userId: string, dto: RequestHintDto) {
    const problem = await this.problemModel.findById(dto.problemId).exec();
    if (!problem) throw new NotFoundException('Problem not found');

    // Get or create hint session
    let session = await this.hintModel.findOne({
      userId: new Types.ObjectId(userId),
      problemId: new Types.ObjectId(dto.problemId),
    });

    if (!session) {
      session = await this.hintModel.create({
        userId: new Types.ObjectId(userId),
        problemId: new Types.ObjectId(dto.problemId),
        messages: [],
        hintLevel: dto.hintLevel || 1,
      });
    }

    // Build conversation history for AI
    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call AI service
    const aiResponse = await this.aiClient.getHint({
      problem_title: problem.title,
      problem_description: problem.description,
      user_code: dto.code || '',
      language: dto.language || 'python',
      hint_level: dto.hintLevel || session.hintLevel,
      conversation_history: history,
    });

    // Save messages
    const now = new Date();
    const newMessages = [
      ...(dto.code ? [{ role: 'user' as const, content: `Here is my code:\n\`\`\`${dto.language || 'python'}\n${dto.code}\n\`\`\``, timestamp: now }] : []),
      { role: 'assistant' as const, content: aiResponse.hint, timestamp: now },
    ];

    await this.hintModel.findByIdAndUpdate(session._id, {
      $push: { messages: { $each: newMessages } },
      $set: { hintLevel: dto.hintLevel || session.hintLevel },
    });

    return {
      hint: aiResponse.hint,
      model: aiResponse.model,
      hintLevel: dto.hintLevel || session.hintLevel,
      sessionId: session._id,
    };
  }

  async getSession(userId: string, problemId: string) {
    return this.hintModel.findOne({
      userId: new Types.ObjectId(userId),
      problemId: new Types.ObjectId(problemId),
    });
  }

  async clearSession(userId: string, problemId: string) {
    await this.hintModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), problemId: new Types.ObjectId(problemId) },
      { $set: { messages: [], hintLevel: 1 } },
    );
    return { message: 'Hint session cleared' };
  }
}
