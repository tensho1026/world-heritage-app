import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThanOrEqual, Repository } from 'typeorm';
import { ComprehensionHistory } from '../../database/entities/comprehension-history.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import {
  VocabularyReview,
  VocabularyReviewRating,
} from '../../database/entities/vocabulary-review.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(HeritageRead)
    private readonly readRepository: Repository<HeritageRead>,
    @InjectRepository(SavedVocabulary)
    private readonly vocabularyRepository: Repository<SavedVocabulary>,
    @InjectRepository(VocabularyReview)
    private readonly reviewRepository: Repository<VocabularyReview>,
    @InjectRepository(ComprehensionHistory)
    private readonly comprehensionRepository: Repository<ComprehensionHistory>,
    @InjectRepository(QuizAttempt)
    private readonly quizRepository: Repository<QuizAttempt>,
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
  ) {}

  async getCalendar(requestedMonth?: string) {
    const month = requestedMonth ?? this.formatDay(new Date()).slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('month must use YYYY-MM format.');
    }
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(`${month}-01T00:00:00+09:00`);
    const nextYear = monthNumber === 12 ? year + 1 : year;
    const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
    const end = new Date(
      `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+09:00`,
    );
    const [reads, vocabulary, reviews] = await Promise.all([
      this.readRepository.find({ where: { readAt: Between(start, end) } }),
      this.vocabularyRepository.find({
        where: { createdAt: Between(start, end) },
      }),
      this.reviewRepository.find({
        where: { reviewedAt: Between(start, end) },
      }),
    ]);
    const days: Record<
      string,
      { reads: number; savedVocabulary: number; reviews: number; total: number }
    > = {};
    const add = (date: Date, key: 'reads' | 'savedVocabulary' | 'reviews') => {
      const day = this.formatDay(date);
      days[day] ??= { reads: 0, savedVocabulary: 0, reviews: 0, total: 0 };
      days[day][key] += 1;
      days[day].total += 1;
    };
    reads.forEach((item) => add(item.readAt, 'reads'));
    vocabulary.forEach((item) => add(item.createdAt, 'savedVocabulary'));
    reviews.forEach((item) => add(item.reviewedAt, 'reviews'));
    return { month, days, activeDays: Object.keys(days).length };
  }

  async getWeekly() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const nextWeekEnd = new Date(now.getTime() + 7 * 86_400_000);
    const [reads, vocabulary, reviews, comprehensionChanges, attempts] =
      await Promise.all([
        this.readRepository.find({
          where: { readAt: MoreThanOrEqual(start) },
          order: { readAt: 'DESC' },
        }),
        this.vocabularyRepository.find({
          where: { createdAt: MoreThanOrEqual(start) },
          order: { createdAt: 'DESC' },
        }),
        this.reviewRepository.find({
          where: { reviewedAt: MoreThanOrEqual(start) },
          order: { reviewedAt: 'DESC' },
        }),
        this.comprehensionRepository.find({
          where: { changedAt: MoreThanOrEqual(start) },
          order: { changedAt: 'DESC' },
        }),
        this.quizRepository.find({
          where: { completedAt: MoreThanOrEqual(start) },
        }),
      ]);

    const siteIds = [
      ...new Set([
        ...reads.map((item) => item.heritageSiteId),
        ...comprehensionChanges.map((item) => item.heritageSiteId),
      ]),
    ];
    const sites = siteIds.length
      ? await this.heritageRepository.findBy({ uuid: In(siteIds) })
      : [];
    const siteMap = new Map(sites.map((site) => [site.uuid, site.nameEn]));
    const readCounts = new Map<string, number>();
    reads.forEach((item) =>
      readCounts.set(
        item.heritageSiteId,
        (readCounts.get(item.heritageSiteId) ?? 0) + 1,
      ),
    );

    const difficultCounts = new Map<number, number>();
    reviews
      .filter((review) => review.rating !== VocabularyReviewRating.GOOD)
      .forEach((review) =>
        difficultCounts.set(
          review.vocabularyId,
          (difficultCounts.get(review.vocabularyId) ?? 0) + 1,
        ),
      );
    const difficultIds = [...difficultCounts.keys()];
    const difficultVocabulary = difficultIds.length
      ? await this.vocabularyRepository.findBy({ id: In(difficultIds) })
      : [];

    const nextWeekReviewCount = await this.vocabularyRepository.count({
      where: {
        isInMemorization: true,
        nextReviewAt: Between(now, nextWeekEnd),
      },
    });
    const quizQuestionCount = attempts.reduce(
      (total, attempt) => total + attempt.total,
      0,
    );
    const quizScore = attempts.reduce(
      (total, attempt) => total + attempt.score,
      0,
    );

    return {
      generatedAt: now,
      periodStart: start,
      periodEnd: now,
      readSites: [...readCounts.entries()].map(([heritageSiteId, count]) => ({
        heritageSiteId,
        nameEn: siteMap.get(heritageSiteId) ?? 'Unknown site',
        count,
      })),
      newVocabulary: vocabulary.map((item) => ({
        id: item.id,
        expression: item.expression,
        translationJa: item.translationJa,
      })),
      difficultVocabulary: difficultVocabulary
        .map((item) => ({
          id: item.id,
          expression: item.expression,
          translationJa: item.translationJa,
          difficultReviews: difficultCounts.get(item.id) ?? 0,
          totalLapses: item.lapseCount,
        }))
        .sort((a, b) => b.difficultReviews - a.difficultReviews),
      comprehensionChanges: comprehensionChanges.map((item) => ({
        ...item,
        heritageNameEn: siteMap.get(item.heritageSiteId) ?? 'Unknown site',
      })),
      nextWeekReviewCount,
      reviewCount: reviews.length,
      quizAttempts: attempts.length,
      quizAccuracy: quizQuestionCount
        ? Math.round((quizScore / quizQuestionCount) * 100)
        : null,
    };
  }

  private formatDay(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  }
}
