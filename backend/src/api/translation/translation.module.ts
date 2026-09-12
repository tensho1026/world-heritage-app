import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationCache } from '../../database/entities/translation-cache.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { DeepLService } from './deepl.service';
import { LibreTranslateService } from './libretranslate.service';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { TranslationRateLimit } from '../../database/entities/translation-rate-limit.entity';
import { TranslationRateLimitService } from './translation-rate-limit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorldHeritageSite,
      TranslationCache,
      TranslationRateLimit,
    ]),
  ],
  controllers: [TranslationController],
  providers: [
    TranslationService,
    LibreTranslateService,
    DeepLService,
    TranslationRateLimitService,
  ],
})
export class TranslationModule {}
