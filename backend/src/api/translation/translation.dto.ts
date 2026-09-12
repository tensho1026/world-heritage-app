import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class TranslateArticleDto {
  @IsUUID()
  heritageSiteId: string;
}

export class TranslateSelectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  expression: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  sourceSentenceEn: string;
}
