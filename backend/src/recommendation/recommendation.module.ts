import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { Submission, SubmissionSchema } from '../submissions/submission.schema';
import { Problem, ProblemSchema } from '../problems/problem.schema';
import { User, UserSchema } from '../users/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: Problem.name, schema: ProblemSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
