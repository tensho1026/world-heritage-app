import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LearningExerciseType } from '../../database/entities/learning-exercise-attempt.entity';

export class CreatePracticeAttemptDto {
  @IsUUID()
  heritageSiteId: string;

  @IsEnum(LearningExerciseType)
  type: LearningExerciseType;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  sourceSentenceEn: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  answerText: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  score: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(20)
  hintsUsed: number;

  @IsInt()
  @Min(0)
  @Max(100)
  playbackCount: number;
}
