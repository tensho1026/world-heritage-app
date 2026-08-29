import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { DeepLService } from './deepl.service';
import { LibreTranslateService } from './libretranslate.service';

const ARTICLE_FIELDS = {
  nameEn: 'nameJa',
  shortDescriptionEn: 'shortDescriptionJa',
  descriptionEn: 'descriptionJa',
  justificationEn: 'justificationJa',
  criteriaText: 'criteriaTextJa',
  mainImageCaptionEn: 'mainImageCaptionJa',
} as const;

const DEEPL_ARTICLE_FIELDS = Object.keys(ARTICLE_FIELDS) as Array<
  keyof typeof ARTICLE_FIELDS
>;

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    private readonly libreTranslateService: LibreTranslateService,
    private readonly deepLService: DeepLService,
  ) {}

  async translateArticle(heritageSiteId: string) {
    const site = await this.heritageRepository.findOneBy({
      uuid: heritageSiteId,
    });
    if (!site)
      throw new NotFoundException('World Heritage site was not found.');

    return Object.fromEntries(
      Object.entries(ARTICLE_FIELDS).flatMap(
        ([englishField, japaneseField]) => {
          const translation = site[japaneseField as keyof WorldHeritageSite];
          return typeof translation === 'string' && translation.trim()
            ? [[englishField, translation]]
            : [];
        },
      ),
    );
  }

  async translateArticleWithDeepL(heritageSiteId: string) {
    const site = await this.heritageRepository.findOneBy({
      uuid: heritageSiteId,
    });
    if (!site)
      throw new NotFoundException('World Heritage site was not found.');

    const presentFields = DEEPL_ARTICLE_FIELDS.filter((field) => {
      const value = site[field];
      return typeof value === 'string' && value.trim().length > 0;
    });
    const translations = await this.deepLService.translateTexts(
      presentFields.map((field) => site[field] as string),
    );

    return Object.fromEntries(
      presentFields.map((field, index) => [field, translations[index]]),
    );
  }

  async translateSelection(expression: unknown, sourceSentenceEn: unknown) {
    if (typeof expression !== 'string' || !expression.trim()) {
      throw new BadRequestException('An English expression is required.');
    }
    const normalizedExpression = expression.trim();
    if (normalizedExpression.length > 100) {
      throw new BadRequestException('The selected expression is too long.');
    }
    if (typeof sourceSentenceEn !== 'string' || !sourceSentenceEn.trim()) {
      throw new BadRequestException('A source sentence is required.');
    }
    if (sourceSentenceEn.length > 2_000) {
      throw new BadRequestException('The source sentence is too long.');
    }

    const [translationJa] = await this.libreTranslateService.translateTexts([
      normalizedExpression,
    ]);
    return { translationJa };
  }
}
