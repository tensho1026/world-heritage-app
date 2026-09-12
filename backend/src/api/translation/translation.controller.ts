import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TranslationService } from './translation.service';
import { TranslateArticleDto, TranslateSelectionDto } from './translation.dto';
import { TranslationRateLimitService } from './translation-rate-limit.service';

@Controller('translations')
export class TranslationController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly rateLimitService: TranslationRateLimitService,
  ) {}

  @Post('article')
  translateArticle(@Body() input: TranslateArticleDto) {
    return this.translationService.translateArticle(input.heritageSiteId);
  }

  @Post('article/deepl')
  async translateArticleWithDeepL(
    @Body() input: TranslateArticleDto,
    @Req() request: Request,
  ) {
    await this.rateLimitService.consume(request.ip ?? 'unknown', 'article');
    return this.translationService.translateArticleWithDeepL(
      input.heritageSiteId,
    );
  }

  @Post('selection')
  async translateSelection(
    @Body() input: TranslateSelectionDto,
    @Req() request: Request,
  ) {
    await this.rateLimitService.consume(request.ip ?? 'unknown', 'selection');
    return this.translationService.translateSelection(
      input.expression,
      input.sourceSentenceEn,
    );
  }
}
