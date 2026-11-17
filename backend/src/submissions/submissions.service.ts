import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument, Verdict } from './submission.schema';
import { Problem, ProblemDocument } from '../problems/problem.schema';
import { DockerSandboxService } from './sandbox/docker-sandbox.service';
import { UsersService } from '../users/users.service';
import { AiClientService } from '../hints/ai-client.service';
import { CreateSubmissionDto } from './dto/submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(Problem.name) private problemModel: Model<ProblemDocument>,
    private sandbox: DockerSandboxService,
    private usersService: UsersService,
    private aiClient: AiClientService,
  ) {}

  async create(userId: string, dto: CreateSubmissionDto) {
    const problem = await this.problemModel.findById(dto.problemId).exec();
    if (!problem) throw new NotFoundException('Problem not found');

    // Create pending submission immediately so frontend can poll
    const submission = await this.submissionModel.create({
      userId: new Types.ObjectId(userId),
      problemId: new Types.ObjectId(dto.problemId),
      code: dto.code,
      language: dto.language,
      verdict: 'PENDING',
      testCasesTotal: problem.testCases.length,
    });

    // Judge asynchronously
    this.judgeSubmission(submission.id, dto.code, dto.language, problem).catch(
      (err) => console.error('Judge error:', err),
    );

    return submission;
  }

  private async judgeSubmission(
    submissionId: string,
    code: string,
    language: 'cpp' | 'python',
    problem: ProblemDocument,
  ) {
    const testCases = problem.testCases;
    let passed = 0;
    let finalVerdict: Verdict = 'AC';
    let lastOutput = '';
    let lastError = '';
    let maxRuntime = 0;

    for (const tc of testCases) {
      const result = await this.sandbox.runCode(code, language, tc.input);
      maxRuntime = Math.max(maxRuntime, result.runtimeMs);

      if (result.timedOut) {
        finalVerdict = 'TLE';
        lastError = 'Time Limit Exceeded';
        break;
      }

      if (result.exitCode !== 0) {
        if (language === 'cpp' && result.stderr.includes('error:') && passed === 0) {
          finalVerdict = 'CE';
          lastError = result.stderr;
        } else {
          finalVerdict = 'RE';
          lastError = result.stderr;
        }
        break;
      }

      const actual = result.stdout.trim().replace(/\r\n/g, '\n');
      const expected = tc.expectedOutput.trim().replace(/\r\n/g, '\n');
      lastOutput = actual;

      if (actual === expected) {
        passed++;
      } else {
        finalVerdict = 'WA';
        lastError = `Expected:\n${expected}\n\nGot:\n${actual}`;
        break;
      }
    }

    // Generate AI feedback (non-blocking — if it fails, submission still saves)
    let aiFeedback = '';
    try {
      const feedbackResult = await this.aiClient.analyzeCode(code, language, {
        verdict: finalVerdict,
        passed,
        total: testCases.length,
        problemTitle: problem.title,
        errorMessage: lastError,
      });
      aiFeedback = feedbackResult.analysis;
    } catch {
      aiFeedback = '';
    }

    // Save final result
    await this.submissionModel.findByIdAndUpdate(submissionId, {
      verdict: finalVerdict,
      testCasesPassed: passed,
      output: lastOutput,
      errorMessage: lastError,
      runtime: maxRuntime,
      aiFeedback,
    });

    // Update user stats
    const submission = await this.submissionModel.findById(submissionId);
    if (submission) {
      const userId = submission.userId.toString();
      const user = await this.usersService.findById(userId);
      if (user) {
        const newAttempted = (user.stats?.attempted || 0) + 1;
        const wasAlreadySolved = await this.submissionModel.exists({
          userId: submission.userId,
          problemId: submission.problemId,
          verdict: 'AC',
          _id: { $ne: submissionId },
        });
        const newSolved = finalVerdict === 'AC' && !wasAlreadySolved
          ? (user.stats?.solved || 0) + 1
          : user.stats?.solved || 0;

        // Update rating: +10 for AC, -2 for WA/TLE/RE
        const ratingDelta = finalVerdict === 'AC' ? 10 : finalVerdict === 'WA' || finalVerdict === 'TLE' ? -2 : 0;
        const newRating = Math.max(0, (user.stats?.rating || 1000) + ratingDelta);

        await this.usersService.updateStats(userId, {
          attempted: newAttempted,
          solved: newSolved,
          rating: newRating,
        });

        if (finalVerdict === 'WA' || finalVerdict === 'TLE') {
          for (const tag of (problem.tags || [])) {
            await this.usersService.addWeakTag(userId, tag);
          }
        }
      }
    }
  }

  async findById(id: string) {
    const s = await this.submissionModel.findById(id).populate('problemId', 'title slug').exec();
    if (!s) throw new NotFoundException('Submission not found');
    return s;
  }

  async findByUser(userId: string, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.submissionModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('problemId', 'title slug difficulty')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.submissionModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  /** Get all submissions by a user for a specific problem, newest first */
  async findByUserAndProblem(userId: string, problemId: string, limit = 10) {
    return this.submissionModel
      .find({
        userId: new Types.ObjectId(userId),
        problemId: new Types.ObjectId(problemId),
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByProblem(problemId: string, limit = 20) {
    return this.submissionModel
      .find({ problemId: new Types.ObjectId(problemId) })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
