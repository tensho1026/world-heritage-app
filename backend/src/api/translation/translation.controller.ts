import { Body, Controller, Post } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('article')
  translateArticle(@Body('heritageSiteId') heritageSiteId: string) {
    return this.translationService.translateArticle(heritageSiteId);
  }

  @Post('selection')
  translateSelection(
    @Body('expression') expression: unknown,
    @Body('sourceSentenceEn') sourceSentenceEn: unknown,
  ) {
    return this.translationService.translateSelection(
      expression,
      sourceSentenceEn,
    );
  }
}
