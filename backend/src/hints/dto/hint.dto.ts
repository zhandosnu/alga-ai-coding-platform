import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestHintDto {
  @ApiProperty()
  @IsString()
  problemId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 3 })
  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  hintLevel?: number;

  @ApiPropertyOptional({ description: 'Language of the submitted code' })
  @IsString()
  @IsOptional()
  language?: string;
}
