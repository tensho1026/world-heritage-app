import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, Repository } from 'typeorm';
import { DiscoveryService } from '../discovery/discovery.service';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import {
  LearningExerciseAttempt,
  LearningExerciseType,
} from '../../database/entities/learning-exercise-attempt.entity';
import {
  ChallengeFilters,
  ChallengeMetric,
  MonthlyChallenge,
} from '../../database/entities/monthly-challenge.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularyReview } from '../../database/entities/vocabulary-review.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

export type ChallengeInput = {
  name?: unknown;
  month?: unknown;
  metric?: unknown;
  target?: unknown;
  filters?: unknown;
  note?: unknown;
};

export function challengeMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(`${month}-01T00:00:00+09:00`);
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const end = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+09:00`,
  );
  return { start, end, endInclusive: new Date(end.getTime() - 1) };
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(MonthlyChallenge)
    private readonly challengeRepository: Repository<MonthlyChallenge>,
    @InjectRepository(HeritageRead)
    private readonly readRepository: Repository<HeritageRead>,
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    @InjectRepository(SavedVocabulary)
    private readonly vocabularyRepository: Repository<SavedVocabulary>,
    @InjectRepository(VocabularyReview)
    private readonly reviewRepository: Repository<VocabularyReview>,
    @InjectRepository(QuizAttempt)
    private readonly quizRepository: Repository<QuizAttempt>,
    @InjectRepository(LearningExerciseAttempt)
    private readonly exerciseRepository: Repository<LearningExerciseAttempt>,
    private readonly discoveryService: DiscoveryService,
  ) {}

  async list(month?: string) {
    if (month) this.validateMonth(month);
    const challenges = await this.challengeRepository.find({
      ...(month ? { where: { month } } : {}),
      order: { month: 'DESC', createdAt: 'ASC' },
    });
    return Promise.all(challenges.map((item) => this.withProgress(item)));
  }

  async create(input: ChallengeInput) {
    const values = this.validate(input, false);
    const challenge = await this.challengeRepository.save(
      this.challengeRepository.create(values as MonthlyChallenge),
    );
    return this.withProgress(challenge);
  }

  async update(id: number, input: ChallengeInput) {
    const challenge = await this.requireChallenge(id);
    Object.assign(challenge, this.validate(input, true));
    return this.withProgress(await this.challengeRepository.save(challenge));
  }

  async remove(id: number) {
    const challenge = await this.requireChallenge(id);
    await this.challengeRepository.remove(challenge);
    return { deleted: true };
  }

  private async withProgress(challenge: MonthlyChallenge) {
    const progress = await this.calculateProgress(challenge);
    const { start, end } = challengeMonthRange(challenge.month);
    const now = new Date();
    return {
      ...challenge,
      progress,
      percentage: Math.min(
        100,
        Math.round((progress / challenge.target) * 100),
      ),
      completed: progress >= challenge.target,
      status: now < start ? 'upcoming' : now >= end ? 'ended' : 'active',
    };
  }

  private async calculateProgress(challenge: MonthlyChallenge) {
    const { start, endInclusive } = challengeMonthRange(challenge.month);
    const range = Between(start, endInclusive);
    switch (challenge.metric) {
      case ChallengeMetric.VOCABULARY_SAVED:
        return this.vocabularyRepository.count({ where: { createdAt: range } });
      case ChallengeMetric.VOCABULARY_REVIEWS:
        return this.reviewRepository.count({ where: { reviewedAt: range } });
      case ChallengeMetric.QUIZ_ATTEMPTS:
        return this.quizRepository.count({ where: { completedAt: range } });
      case ChallengeMetric.DICTATION_ATTEMPTS:
      case ChallengeMetric.WRITING_ATTEMPTS:
        return this.exerciseRepository.count({
          where: {
            completedAt: range,
            type:
              challenge.metric === ChallengeMetric.DICTATION_ATTEMPTS
                ? LearningExerciseType.DICTATION
                : LearningExerciseType.WRITING,
          },
        });
      case ChallengeMetric.NEW_COUNTRIES:
        return this.newCountries(start, endInclusive);
      case ChallengeMetric.FILTERED_READS:
        return this.filteredReads(start, endInclusive, challenge.filters);
      case ChallengeMetric.UNIQUE_SITES:
      default: {
        const reads = await this.readRepository.find({
          where: { readAt: range },
        });
        return new Set(reads.map((read) => read.heritageSiteId)).size;
      }
    }
  }

  private async newCountries(start: Date, endInclusive: Date) {
    const [currentReads, previousReads] = await Promise.all([
      this.readRepository.find({
        where: { readAt: Between(start, endInclusive) },
      }),
      this.readRepository.find({ where: { readAt: LessThan(start) } }),
    ]);
    const ids = [
      ...new Set(
        [...currentReads, ...previousReads].map((read) => read.heritageSiteId),
      ),
    ];
    if (!ids.length) return 0;
    const sites = await this.heritageRepository.findBy({ uuid: In(ids) });
    const siteMap = new Map(sites.map((site) => [site.uuid, site]));
    const countriesFor = (reads: HeritageRead[]) =>
      new Set(
        reads.flatMap((read) => {
          const site = siteMap.get(read.heritageSiteId);
          return site?.isoCodes.length
            ? site.isoCodes
            : (site?.statesNames ?? []);
        }),
      );
    const current = countriesFor(currentReads);
    const previous = countriesFor(previousReads);
    return [...current].filter((country) => !previous.has(country)).length;
  }

  private async filteredReads(
    start: Date,
    endInclusive: Date,
    filters: ChallengeFilters,
  ) {
    const [reads, matchingSites] = await Promise.all([
      this.readRepository.find({
        where: { readAt: Between(start, endInclusive) },
      }),
      this.discoveryService.search(filters),
    ]);
    const allowed = new Set(matchingSites.map((site) => site.uuid));
    return new Set(
      reads
        .map((read) => read.heritageSiteId)
        .filter((heritageSiteId) => allowed.has(heritageSiteId)),
    ).size;
  }

  private validate(input: ChallengeInput, partial: boolean) {
    const result: Partial<MonthlyChallenge> = {};
    if (!partial || input.name !== undefined) {
      result.name = this.string(input.name, 'name', 1, 120);
    }
    if (!partial || input.month !== undefined) {
      result.month = this.string(input.month, 'month', 7, 7);
      this.validateMonth(result.month);
    }
    if (!partial || input.metric !== undefined) {
      if (!Object.values(ChallengeMetric).includes(input.metric as never)) {
        throw new BadRequestException('metric is invalid.');
      }
      result.metric = input.metric as ChallengeMetric;
    }
    if (!partial || input.target !== undefined) {
      if (
        typeof input.target !== 'number' ||
        !Number.isInteger(input.target) ||
        input.target < 1 ||
        input.target > 10_000
      ) {
        throw new BadRequestException('target is invalid.');
      }
      result.target = input.target;
    }
    if (!partial || input.filters !== undefined) {
      result.filters = this.filters(input.filters ?? {});
    }
    if (!partial || input.note !== undefined) {
      result.note = this.string(input.note ?? '', 'note', 0, 1_000);
    }
    return result;
  }

  private filters(value: unknown): ChallengeFilters {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('filters is invalid.');
    }
    const input = value as Record<string, unknown>;
    const result: ChallengeFilters = {};
    for (const key of ['country', 'region', 'category', 'theme'] as const) {
      if (input[key] !== undefined && input[key] !== '') {
        result[key] = this.string(input[key], `filters.${key}`, 1, 120);
      }
    }
    return result;
  }

  private string(value: unknown, name: string, min: number, max: number) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${name} is invalid.`);
    }
    const trimmed = value.trim();
    if (trimmed.length < min || trimmed.length > max) {
      throw new BadRequestException(`${name} is invalid.`);
    }
    return trimmed;
  }

  private validateMonth(month: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('month must use YYYY-MM format.');
    }
  }

  private async requireChallenge(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Invalid challenge id.');
    }
    const challenge = await this.challengeRepository.findOneBy({ id });
    if (!challenge) throw new NotFoundException('Challenge was not found.');
    return challenge;
  }
}
