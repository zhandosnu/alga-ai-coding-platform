import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission, SubmissionSchema } from './submission.schema';
import { Problem, ProblemSchema } from '../problems/problem.schema';
import { DockerSandboxService } from './sandbox/docker-sandbox.service';
import { AiClientService } from '../hints/ai-client.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: Problem.name, schema: ProblemSchema },
    ]),
    UsersModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, DockerSandboxService, AiClientService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
