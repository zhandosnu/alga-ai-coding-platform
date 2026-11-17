import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { Problem, ProblemSchema } from './problem.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Problem.name, schema: ProblemSchema }])],
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
