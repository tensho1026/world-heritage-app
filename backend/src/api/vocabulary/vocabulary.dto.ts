import {
  IsBoolean,
  IsBooleanString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { VocabularyReviewRating } from '../../database/entities/vocabulary-review.entity';

export class VocabularyQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'alphabetical'])
  sort?: string;

  @IsOptional()
  @IsUUID()
  heritageSiteId?: string;

  @IsOptional()
  @IsBooleanString()
  memorization?: string;

  @IsOptional()
  @IsBooleanString()
  uncertain?: string;
}

export class SaveVocabularyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  expression: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  translationJa: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  sourceSentenceEn: string;

  @IsUUID()
  heritageSiteId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  sectionType: string;
}

export class UpdateVocabularyLearningStateDto {
  @IsOptional()
  @IsBoolean()
  isInMemorization?: boolean;

  @IsOptional()
  @IsBoolean()
  isUncertain?: boolean;
}

export class RecordVocabularyReviewDto {
  @IsEnum(VocabularyReviewRating)
  rating: VocabularyReviewRating;
}
