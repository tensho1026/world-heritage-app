import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationCache } from '../../database/entities/translation-cache.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { DeepLService } from './deepl.service';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorldHeritageSite, TranslationCache])],
  controllers: [TranslationController],
  providers: [TranslationService, DeepLService],
})
export class TranslationModule {}
