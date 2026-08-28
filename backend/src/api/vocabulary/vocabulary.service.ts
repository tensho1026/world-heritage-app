import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularySource } from '../../database/entities/vocabulary-source.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import {
  VocabularyReview,
  VocabularyReviewRating,
} from '../../database/entities/vocabulary-review.entity';

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
    @InjectRepository(VocabularyReview)
    private readonly reviewRepository: Repository<VocabularyReview>,
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
    memorization?: string,
    uncertain?: string,
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

    if (memorization === 'true' || memorization === 'false') {
      query.andWhere('vocabulary.isInMemorization = :isInMemorization', {
        isInMemorization: memorization === 'true',
      });
    }

    if (uncertain === 'true' || uncertain === 'false') {
      query.andWhere('vocabulary.isUncertain = :isUncertain', {
        isUncertain: uncertain === 'true',
      });
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

  async updateLearningState(
    id: number,
    changes: { isInMemorization?: unknown; isUncertain?: unknown },
  ) {
    const vocabulary = await this.vocabularyRepository.findOneBy({ id });
    if (!vocabulary) throw new NotFoundException('Vocabulary was not found.');

    const hasMemorization = typeof changes.isInMemorization === 'boolean';
    const hasUncertain = typeof changes.isUncertain === 'boolean';
    if (!hasMemorization && !hasUncertain) {
      throw new BadRequestException('A vocabulary learning state is required.');
    }

    // These states intentionally remain independent. Updating one must never
    // implicitly update the other.
    if (hasMemorization) {
      vocabulary.isInMemorization = changes.isInMemorization as boolean;
    }
    if (hasUncertain) {
      vocabulary.isUncertain = changes.isUncertain as boolean;
    }

    await this.vocabularyRepository.save(vocabulary);
    return this.getOne(id);
  }

  async count() {
    return this.vocabularyRepository.count();
  }

  async getDueReviews() {
    const vocabulary = await this.vocabularyRepository.find({
      where: {
        isInMemorization: true,
        nextReviewAt: LessThanOrEqual(new Date()),
      },
      order: { lapseCount: 'DESC', nextReviewAt: 'ASC', createdAt: 'ASC' },
      take: 200,
    });
    return this.attachSources(vocabulary);
  }

  async getReviewSummary() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now.getTime() + 7 * 86_400_000);
    const [dueToday, reviewedToday, upcomingWeek] = await Promise.all([
      this.vocabularyRepository.count({
        where: {
          isInMemorization: true,
          nextReviewAt: LessThanOrEqual(now),
        },
      }),
      this.reviewRepository.count({
        where: { reviewedAt: MoreThan(startOfToday) },
      }),
      this.vocabularyRepository
        .createQueryBuilder('vocabulary')
        .where('vocabulary.isInMemorization = true')
        .andWhere('vocabulary.nextReviewAt > :now', { now })
        .andWhere('vocabulary.nextReviewAt <= :endOfWeek', { endOfWeek })
        .getCount(),
    ]);
    return { dueToday, reviewedToday, upcomingWeek };
  }

  async recordReview(id: number, rating: VocabularyReviewRating) {
    if (!Object.values(VocabularyReviewRating).includes(rating)) {
      throw new BadRequestException('Invalid review rating.');
    }
    const vocabulary = await this.vocabularyRepository.findOneBy({ id });
    if (!vocabulary) throw new NotFoundException('Vocabulary was not found.');

    const now = new Date();
    const previousIntervalDays = vocabulary.reviewIntervalDays;
    let nextIntervalDays: number;
    if (rating === VocabularyReviewRating.AGAIN) {
      nextIntervalDays = 10 / (24 * 60);
      vocabulary.reviewEaseFactor = Math.max(
        1.3,
        vocabulary.reviewEaseFactor - 0.2,
      );
      vocabulary.lapseCount += 1;
      vocabulary.isUncertain = true;
    } else if (rating === VocabularyReviewRating.HARD) {
      nextIntervalDays =
        previousIntervalDays < 1 ? 1 : Math.max(1, previousIntervalDays * 1.2);
      vocabulary.reviewEaseFactor = Math.max(
        1.3,
        vocabulary.reviewEaseFactor - 0.15,
      );
      vocabulary.isUncertain = true;
    } else {
      nextIntervalDays =
        vocabulary.reviewCount === 0
          ? 1
          : previousIntervalDays < 1
            ? 3
            : Math.max(3, previousIntervalDays * vocabulary.reviewEaseFactor);
      vocabulary.reviewEaseFactor = Math.min(
        3,
        vocabulary.reviewEaseFactor + 0.05,
      );
      vocabulary.isUncertain = false;
    }

    nextIntervalDays = Math.round(nextIntervalDays * 1000) / 1000;
    vocabulary.reviewIntervalDays = nextIntervalDays;
    vocabulary.reviewCount += 1;
    vocabulary.lastReviewedAt = now;
    vocabulary.nextReviewAt = new Date(
      now.getTime() + nextIntervalDays * 86_400_000,
    );
    await this.vocabularyRepository.save(vocabulary);
    await this.reviewRepository.save(
      this.reviewRepository.create({
        vocabularyId: id,
        rating,
        previousIntervalDays,
        nextIntervalDays,
        nextReviewAt: vocabulary.nextReviewAt,
      }),
    );
    return this.getOne(id);
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
