import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubmissionDocument = Submission & Document;

export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'PENDING';

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Problem', required: true })
  problemId: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ['cpp', 'python'] })
  language: string;

  @Prop({ enum: ['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'PENDING'], default: 'PENDING' })
  verdict: Verdict;

  @Prop({ default: 0 })
  runtime: number; // ms

  @Prop({ default: 0 })
  memory: number; // KB

  @Prop()
  output: string;

  @Prop()
  errorMessage: string;

  @Prop({ default: 0 })
  testCasesTotal: number;

  @Prop({ default: 0 })
  testCasesPassed: number;

  @Prop({ default: '' })
  aiFeedback: string;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ userId: 1, createdAt: -1 });
SubmissionSchema.index({ problemId: 1 });
