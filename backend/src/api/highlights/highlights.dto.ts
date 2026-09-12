import { PartialType, PickType } from '@nestjs/mapped-types';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateHighlightDto {
  @IsUUID()
  heritageSiteId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  sectionKey: string;

  @IsInt()
  @Min(0)
  startOffset: number;

  @IsInt()
  @Min(1)
  endOffset: number;

  @IsString()
  @MinLength(1)
  @MaxLength(4_000)
  selectedText: string;

  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  noteJa?: string;

  @IsOptional()
  @IsString()
  @IsIn(['vocabulary', 'grammar', 'long-sentence', 'reference', 'other'])
  difficultyReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  reasonDetail?: string;
}

export class UpdateHighlightDto extends PartialType(
  PickType(CreateHighlightDto, [
    'noteJa',
    'difficultyReason',
    'reasonDetail',
  ] as const),
) {}
