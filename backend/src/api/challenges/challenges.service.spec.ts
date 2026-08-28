import { Repository } from 'typeorm';
import { DiscoveryService } from '../discovery/discovery.service';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { LearningExerciseAttempt } from '../../database/entities/learning-exercise-attempt.entity';
import {
  ChallengeMetric,
  MonthlyChallenge,
} from '../../database/entities/monthly-challenge.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularyReview } from '../../database/entities/vocabulary-review.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { ChallengesService } from './challenges.service';

describe('ChallengesService', () => {
  const challengeRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: 1,
      createdAt: new Date(),
      ...value,
    })),
    find: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };
  const readRepository = { find: jest.fn() };
  const heritageRepository = { findBy: jest.fn() };
  const vocabularyRepository = { count: jest.fn() };
  const reviewRepository = { count: jest.fn() };
  const quizRepository = { count: jest.fn() };
  const exerciseRepository = { count: jest.fn() };
  const discoveryService = { search: jest.fn() };
  const service = new ChallengesService(
    challengeRepository as unknown as Repository<MonthlyChallenge>,
    readRepository as unknown as Repository<HeritageRead>,
    heritageRepository as unknown as Repository<WorldHeritageSite>,
    vocabularyRepository as unknown as Repository<SavedVocabulary>,
    reviewRepository as unknown as Repository<VocabularyReview>,
    quizRepository as unknown as Repository<QuizAttempt>,
    exerciseRepository as unknown as Repository<LearningExerciseAttempt>,
    discoveryService as unknown as DiscoveryService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    vocabularyRepository.count.mockResolvedValue(4);
  });

  it('creates a self-defined challenge and calculates progress', async () => {
    await expect(
      service.create({
        name: '今月は単語を保存する',
        month: '2026-08',
        metric: ChallengeMetric.VOCABULARY_SAVED,
        target: 10,
        filters: {},
        note: '自分で決めた目標',
      }),
    ).resolves.toMatchObject({
      id: 1,
      progress: 4,
      percentage: 40,
      completed: false,
    });
  });

  it('rejects an invalid month and target', async () => {
    await expect(
      service.create({
        name: 'invalid',
        month: '2026-13',
        metric: ChallengeMetric.UNIQUE_SITES,
        target: 0,
        filters: {},
      }),
    ).rejects.toThrow('month must use YYYY-MM');
  });
});
