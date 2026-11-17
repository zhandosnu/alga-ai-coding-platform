import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HintDocument = Hint & Document;

export class HintMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Hint {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Problem', required: true })
  problemId: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  messages: HintMessage[];

  @Prop({ default: 1, min: 1, max: 3 })
  hintLevel: number;
}

export const HintSchema = SchemaFactory.createForClass(Hint);
HintSchema.index({ userId: 1, problemId: 1 }, { unique: true });
