import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ChallengeMetric } from '../../database/entities/monthly-challenge.entity';

export class ChallengeFiltersDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  theme?: string;
}

export class CreateChallengeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;

  @IsEnum(ChallengeMetric)
  metric: ChallengeMetric;

  @IsInt()
  @Min(1)
  @Max(10_000)
  target: number;

  @IsObject()
  @ValidateNested()
  @Type(() => ChallengeFiltersDto)
  filters: ChallengeFiltersDto;

  @IsString()
  @MaxLength(1_000)
  note: string;
}

export class UpdateChallengeDto extends PartialType(CreateChallengeDto) {}

export class ChallengeListQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string;
}
