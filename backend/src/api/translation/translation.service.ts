import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { DeepLService } from './deepl.service';

const ARTICLE_FIELDS = {
  nameEn: 'nameJa',
  shortDescriptionEn: 'shortDescriptionJa',
  descriptionEn: 'descriptionJa',
  justificationEn: 'justificationJa',
  criteriaText: 'criteriaTextJa',
  mainImageCaptionEn: 'mainImageCaptionJa',
} as const;

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
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

    const [translationJa] = await this.deepLService.translateTexts(
      [normalizedExpression],
      sourceSentenceEn.trim(),
    );
    return { translationJa };
  }
}
