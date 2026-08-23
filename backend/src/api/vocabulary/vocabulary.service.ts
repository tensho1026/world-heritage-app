import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularySource } from '../../database/entities/vocabulary-source.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

export type SaveVocabularyInput = {
  expression?: unknown;
  translationJa?: unknown;
  sourceSentenceEn?: unknown;
  heritageSiteId?: unknown;
  sectionType?: unknown;
};

type VocabularySort = 'newest' | 'oldest' | 'alphabetical';

@Injectable()
export class VocabularyService {
  constructor(
    @InjectRepository(SavedVocabulary)
    private readonly vocabularyRepository: Repository<SavedVocabulary>,
    @InjectRepository(VocabularySource)
    private readonly sourceRepository: Repository<VocabularySource>,
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
  ) {}

  async save(input: SaveVocabularyInput) {
    const expression = this.requireString(input.expression, 'expression', 100);
    const translationJa = this.requireString(
      input.translationJa,
      'translationJa',
      2_000,
    );
    const sourceSentenceEn = this.requireString(
      input.sourceSentenceEn,
      'sourceSentenceEn',
      2_000,
    );
    const heritageSiteId = this.requireString(
      input.heritageSiteId,
      'heritageSiteId',
      100,
    );
    const sectionType = this.requireString(
      input.sectionType,
      'sectionType',
      40,
    );

    const site = await this.heritageRepository.findOneBy({
      uuid: heritageSiteId,
    });
    if (!site)
      throw new NotFoundException('World Heritage site was not found.');

    const normalizedExpression = this.normalize(expression);
    let vocabulary = await this.vocabularyRepository.findOneBy({
      normalizedExpression,
    });

    if (!vocabulary) {
      vocabulary = await this.vocabularyRepository.save(
        this.vocabularyRepository.create({
          expression,
          normalizedExpression,
          translationJa,
        }),
      );
    }

    await this.sourceRepository.upsert(
      {
        vocabularyId: vocabulary.id,
        heritageSiteId,
        sourceSentenceEn,
        sectionType,
      },
      { conflictPaths: ['vocabularyId', 'heritageSiteId', 'sourceSentenceEn'] },
    );

    return this.getOne(vocabulary.id);
  }

  async getAll(
    search?: string,
    requestedSort?: string,
    heritageSiteId?: string,
  ) {
    const sort: VocabularySort = ['oldest', 'alphabetical'].includes(
      requestedSort ?? '',
    )
      ? (requestedSort as VocabularySort)
      : 'newest';
    const query = this.vocabularyRepository.createQueryBuilder('vocabulary');

    if (search?.trim()) {
      query.andWhere(
        '(vocabulary.expression ILIKE :search OR vocabulary.translationJa ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (heritageSiteId) {
      query.andWhere(
        `EXISTS (${this.sourceRepository
          .createQueryBuilder('source')
          .select('1')
          .where('source.vocabularyId = vocabulary.id')
          .andWhere('source.heritageSiteId = :heritageSiteId')
          .getQuery()})`,
        { heritageSiteId },
      );
    }

    if (sort === 'alphabetical') {
      query.orderBy('vocabulary.normalizedExpression', 'ASC');
    } else {
      query.orderBy('vocabulary.createdAt', sort === 'oldest' ? 'ASC' : 'DESC');
    }

    const vocabulary = await query.take(500).getMany();
    return this.attachSources(vocabulary);
  }

  async getOne(id: number) {
    const vocabulary = await this.vocabularyRepository.findOneBy({ id });
    if (!vocabulary) throw new NotFoundException('Vocabulary was not found.');
    const [result] = await this.attachSources([vocabulary]);
    return result;
  }

  async remove(id: number) {
    const result = await this.vocabularyRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Vocabulary was not found.');
    }
  }

  async count() {
    return this.vocabularyRepository.count();
  }

  private async attachSources(vocabulary: SavedVocabulary[]) {
    if (!vocabulary.length) return [];

    const sources = await this.sourceRepository.find({
      where: { vocabularyId: In(vocabulary.map((item) => item.id)) },
      order: { createdAt: 'DESC' },
    });
    const siteIds = [
      ...new Set(sources.map((source) => source.heritageSiteId)),
    ];
    const sites = siteIds.length
      ? await this.heritageRepository.findBy({ uuid: In(siteIds) })
      : [];
    const siteMap = new Map(sites.map((site) => [site.uuid, site]));

    return vocabulary.map((item) => ({
      ...item,
      sources: sources
        .filter((source) => source.vocabularyId === item.id)
        .map((source) => ({
          ...source,
          heritageNameEn:
            siteMap.get(source.heritageSiteId)?.nameEn ?? 'Unknown site',
        })),
    }));
  }

  private normalize(value: string) {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase('en')
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private requireString(value: unknown, field: string, maxLength: number) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required.`);
    }
    const result = value.trim();
    if (result.length > maxLength) {
      throw new BadRequestException(`${field} is too long.`);
    }
    return result;
  }
}
