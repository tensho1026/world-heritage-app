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

type DailyAggregateRow = { day: string; count: string | number };
type ActiveDateRow = { day: string };
type WeeklyReadRow = {
  heritageSiteId: string;
  count: string | number;
};
type WeeklyVocabularyRow = {
  id: number;
  expression: string;
  translationJa: string;
};
type DifficultReviewRow = {
  vocabularyId: number;
  count: string | number;
};
type WeeklyComprehensionRow = Pick<
  ComprehensionHistory,
  'id' | 'heritageSiteId' | 'previousLevel' | 'nextLevel' | 'changedAt'
>;
type QuizAggregateRow = {
  attempts: string | number;
  questions: string | number;
  score: string | number;
};

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
    const activityStart = new Date(Date.now() - 370 * 86_400_000);
    const [readRows, vocabularyRows, reviewRows, activeDateRows] =
      await Promise.all([
        this.dailyCounts('heritage_read', 'readAt', start, end),
        this.dailyCounts('saved_vocabulary', 'createdAt', start, end),
        this.dailyCounts('vocabulary_review', 'reviewedAt', start, end),
        this.activityDates(activityStart),
      ]);

    const days: Record<
      string,
      { reads: number; savedVocabulary: number; reviews: number; total: number }
    > = {};
    this.addDailyCounts(days, readRows, 'reads');
    this.addDailyCounts(days, vocabularyRows, 'savedVocabulary');
    this.addDailyCounts(days, reviewRows, 'reviews');

    return {
      month,
      days,
      activeDays: Object.keys(days).length,
      currentStreak: this.currentStreak(
        new Set(activeDateRows.map((row) => row.day.slice(0, 10))),
      ),
    };
  }

  async getWeekly() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const nextWeekEnd = new Date(now.getTime() + 7 * 86_400_000);
    const [
      readRows,
      vocabulary,
      difficultRows,
      comprehensionChanges,
      quizRows,
      reviewCount,
      nextWeekReviewCount,
    ] = await Promise.all([
      this.weeklyReadCounts(start),
      this.weeklyVocabulary(start),
      this.difficultReviewCounts(start),
      this.weeklyComprehensionChanges(start),
      this.quizAggregate(start),
      this.reviewRepository.count({
        where: { reviewedAt: MoreThanOrEqual(start) },
      }),
      this.vocabularyRepository.count({
        where: {
          isInMemorization: true,
          nextReviewAt: Between(now, nextWeekEnd),
        },
      }),
    ]);

    const siteIds = [
      ...new Set([
        ...readRows.map((item) => item.heritageSiteId),
        ...comprehensionChanges.map((item) => item.heritageSiteId),
      ]),
    ];
    const sites = siteIds.length
      ? await this.heritageRepository.find({
          select: { uuid: true, nameEn: true },
          where: { uuid: In(siteIds) },
        })
      : [];
    const siteMap = new Map(sites.map((site) => [site.uuid, site.nameEn]));
    const difficultCounts = new Map(
      difficultRows.map((row) => [row.vocabularyId, Number(row.count)]),
    );
    const difficultIds = [...difficultCounts.keys()];
    const difficultVocabulary = difficultIds.length
      ? await this.vocabularyRepository.find({
          select: {
            id: true,
            expression: true,
            translationJa: true,
            lapseCount: true,
          },
          where: { id: In(difficultIds) },
        })
      : [];
    const [quizAggregate] = quizRows;
    const quizQuestionCount = Number(quizAggregate?.questions ?? 0);

    return {
      generatedAt: now,
      periodStart: start,
      periodEnd: now,
      readSites: readRows.map((row) => ({
        heritageSiteId: row.heritageSiteId,
        nameEn: siteMap.get(row.heritageSiteId) ?? 'Unknown site',
        count: Number(row.count),
      })),
      newVocabulary: vocabulary,
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
      reviewCount,
      quizAttempts: Number(quizAggregate?.attempts ?? 0),
      quizAccuracy: quizQuestionCount
        ? Math.round(
            (Number(quizAggregate?.score ?? 0) / quizQuestionCount) * 100,
          )
        : null,
    };
  }

  private dailyCounts(
    table: 'heritage_read' | 'saved_vocabulary' | 'vocabulary_review',
    column: 'readAt' | 'createdAt' | 'reviewedAt',
    start: Date,
    end: Date,
  ) {
    return this.readRepository.query(
      `SELECT TO_CHAR("${column}" AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS count
       FROM "${table}"
       WHERE "${column}" >= $1 AND "${column}" < $2
       GROUP BY 1
       ORDER BY 1`,
      [start, end],
    ) as Promise<DailyAggregateRow[]>;
  }

  private activityDates(start: Date) {
    return this.readRepository.query(
      `SELECT DISTINCT activity.day::text AS day
       FROM (
         SELECT DATE("readAt" AT TIME ZONE 'Asia/Tokyo') AS day
         FROM "heritage_read"
         WHERE "readAt" >= $1
         UNION
         SELECT DATE("createdAt" AT TIME ZONE 'Asia/Tokyo') AS day
         FROM "saved_vocabulary"
         WHERE "createdAt" >= $1
         UNION
         SELECT DATE("reviewedAt" AT TIME ZONE 'Asia/Tokyo') AS day
         FROM "vocabulary_review"
         WHERE "reviewedAt" >= $1
       ) activity
       ORDER BY activity.day`,
      [start],
    ) as Promise<ActiveDateRow[]>;
  }

  private addDailyCounts(
    days: Record<
      string,
      { reads: number; savedVocabulary: number; reviews: number; total: number }
    >,
    rows: DailyAggregateRow[],
    key: 'reads' | 'savedVocabulary' | 'reviews',
  ) {
    rows.forEach((row) => {
      const day = row.day.slice(0, 10);
      const count = Number(row.count);
      days[day] ??= { reads: 0, savedVocabulary: 0, reviews: 0, total: 0 };
      days[day][key] += count;
      days[day].total += count;
    });
  }

  private weeklyReadCounts(start: Date) {
    return this.readRepository.query(
      `SELECT "heritageSiteId" AS "heritageSiteId",
              COUNT(*)::int AS count
       FROM "heritage_read"
       WHERE "readAt" >= $1
       GROUP BY "heritageSiteId"
       ORDER BY MAX("readAt") DESC`,
      [start],
    ) as Promise<WeeklyReadRow[]>;
  }

  private weeklyVocabulary(start: Date) {
    return this.vocabularyRepository.query(
      `SELECT "id", "expression", "translationJa"
       FROM "saved_vocabulary"
       WHERE "createdAt" >= $1
       ORDER BY "createdAt" DESC`,
      [start],
    ) as Promise<WeeklyVocabularyRow[]>;
  }

  private difficultReviewCounts(start: Date) {
    return this.reviewRepository.query(
      `SELECT "vocabularyId" AS "vocabularyId",
              COUNT(*)::int AS count
       FROM "vocabulary_review"
       WHERE "reviewedAt" >= $1 AND "rating" <> $2
       GROUP BY "vocabularyId"`,
      [start, VocabularyReviewRating.GOOD],
    ) as Promise<DifficultReviewRow[]>;
  }

  private weeklyComprehensionChanges(start: Date) {
    return this.comprehensionRepository.query(
      `SELECT "id", "heritageSiteId", "previousLevel", "nextLevel", "changedAt"
       FROM "comprehension_history"
       WHERE "changedAt" >= $1
       ORDER BY "changedAt" DESC`,
      [start],
    ) as Promise<WeeklyComprehensionRow[]>;
  }

  private quizAggregate(start: Date) {
    return this.quizRepository.query(
      `SELECT COUNT(*)::int AS attempts,
              COALESCE(SUM("total"), 0)::int AS questions,
              COALESCE(SUM("score"), 0)::int AS score
       FROM "quiz_attempt"
       WHERE "completedAt" >= $1`,
      [start],
    ) as Promise<QuizAggregateRow[]>;
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

  private currentStreak(activeDates: Set<string>) {
    let cursor = new Date();
    if (!activeDates.has(this.formatDay(cursor))) {
      cursor = new Date(cursor.getTime() - 86_400_000);
    }
    let streak = 0;
    while (activeDates.has(this.formatDay(cursor))) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 86_400_000);
    }
    return streak;
  }
}
