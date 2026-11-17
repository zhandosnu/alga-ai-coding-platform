import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty()
  @IsString()
  problemId: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ enum: ['cpp', 'python'] })
  @IsEnum(['cpp', 'python'])
  language: 'cpp' | 'python';
}
