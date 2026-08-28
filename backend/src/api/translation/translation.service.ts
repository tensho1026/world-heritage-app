import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { DeepLService } from './deepl.service';

const ARTICLE_FIELDS = [
  'nameEn',
  'shortDescriptionEn',
  'descriptionEn',
  'justificationEn',
  'criteriaText',
  'mainImageCaptionEn',
] as const;

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

    const presentFields = ARTICLE_FIELDS.filter(
      (field) => typeof site[field] === 'string' && site[field]!.trim().length,
    );
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

    const [translationJa] = await this.deepLService.translateTexts(
      [normalizedExpression],
      sourceSentenceEn.trim(),
    );
    return { translationJa };
  }
}
