import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProblemDocument = Problem & Document;

export class TestCase {
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

@Schema({ timestamps: true })
export class Problem {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['Easy', 'Medium', 'Hard'] })
  difficulty: string;

  @Prop([String])
  tags: string[];

  @Prop({ default: 2000 })
  timeLimit: number; // ms

  @Prop({ default: 256 })
  memoryLimit: number; // MB

  @Prop({ type: [Object], default: [] })
  testCases: TestCase[];

  @Prop()
  sampleInput: string;

  @Prop()
  sampleOutput: string;

  @Prop()
  constraints: string;

  @Prop({ default: true })
  isPublished: boolean;
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
ProblemSchema.index({ tags: 1, difficulty: 1 });
ProblemSchema.index({ title: 'text', description: 'text' });
