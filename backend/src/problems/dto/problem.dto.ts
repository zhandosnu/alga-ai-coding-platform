import {
  IsString, IsEnum, IsArray, IsOptional, IsNumber, IsBoolean, ValidateNested, ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestCaseDto {
  @ApiProperty()
  @IsString()
  input: string;

  @ApiProperty()
  @IsString()
  expectedOutput: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isSample?: boolean;
}

export class CreateProblemDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['Easy', 'Medium', 'Hard'] })
  @IsEnum(['Easy', 'Medium', 'Hard'])
  difficulty: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ default: 2000 })
  @IsNumber()
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({ default: 256 })
  @IsNumber()
  @IsOptional()
  memoryLimit?: number;

  @ApiProperty({ type: [TestCaseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  @ArrayMinSize(1)
  testCases: TestCaseDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleInput?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleOutput?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  constraints?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateProblemDto extends CreateProblemDto {}

export class ProblemQueryDto {
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number;
}
