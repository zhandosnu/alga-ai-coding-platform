import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export class UserStats {
  solved: number = 0;
  attempted: number = 0;
  weakTags: string[] = [];
  rating: number = 1000;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ type: Object, default: () => new UserStats() })
  stats: UserStats;
}

export const UserSchema = SchemaFactory.createForClass(User);
