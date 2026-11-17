import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HintsService } from './hints.service';
import { HintsController } from './hints.controller';
import { Hint, HintSchema } from './hint.schema';
import { Problem, ProblemSchema } from '../problems/problem.schema';
import { AiClientService } from './ai-client.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hint.name, schema: HintSchema },
      { name: Problem.name, schema: ProblemSchema },
    ]),
  ],
  controllers: [HintsController],
  providers: [HintsService, AiClientService],
})
export class HintsModule {}
