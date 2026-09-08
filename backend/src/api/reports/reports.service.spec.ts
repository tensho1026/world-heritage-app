import { Repository } from 'typeorm';
import { ComprehensionHistory } from '../../database/entities/comprehension-history.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularyReview } from '../../database/entities/vocabulary-review.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const readRepository = { query: jest.fn() };
  const vocabularyRepository = {
    query: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };
  const reviewRepository = { query: jest.fn(), count: jest.fn() };
  const comprehensionRepository = { query: jest.fn() };
  const quizRepository = { query: jest.fn() };
  const heritageRepository = { find: jest.fn() };

  const service = new ReportsService(
    readRepository as unknown as Repository<HeritageRead>,
    vocabularyRepository as unknown as Repository<SavedVocabulary>,
    reviewRepository as unknown as Repository<VocabularyReview>,
    comprehensionRepository as unknown as Repository<ComprehensionHistory>,
    quizRepository as unknown as Repository<QuizAttempt>,
    heritageRepository as unknown as Repository<WorldHeritageSite>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository.query.mockResolvedValue([]);
    vocabularyRepository.query.mockResolvedValue([]);
    vocabularyRepository.count.mockResolvedValue(0);
    vocabularyRepository.find.mockResolvedValue([]);
    reviewRepository.query.mockResolvedValue([]);
    reviewRepository.count.mockResolvedValue(0);
    comprehensionRepository.query.mockResolvedValue([]);
    quizRepository.query.mockResolvedValue([
      { attempts: 0, questions: 0, score: 0 },
    ]);
    heritageRepository.find.mockResolvedValue([]);
  });

  it('builds calendar days from database aggregates', async () => {
    readRepository.query
      .mockResolvedValueOnce([{ day: '2026-09-02', count: 2 }])
      .mockResolvedValueOnce([{ day: '2026-09-02', count: 1 }])
      .mockResolvedValueOnce([{ day: '2026-09-02', count: 3 }])
      .mockResolvedValueOnce([]);

    await expect(service.getCalendar('2026-09')).resolves.toMatchObject({
      month: '2026-09',
      days: {
        '2026-09-02': {
          reads: 2,
          savedVocabulary: 1,
          reviews: 3,
          total: 6,
        },
      },
      activeDays: 1,
    });
    expect(readRepository.query).toHaveBeenCalledTimes(4);
  });

  it('builds weekly summaries from grouped and selected rows', async () => {
    readRepository.query.mockResolvedValue([
      { heritageSiteId: 'site-1', count: 2 },
    ]);
    vocabularyRepository.query.mockResolvedValue([
      { id: 1, expression: 'ruin', translationJa: '遺跡' },
    ]);
    reviewRepository.query.mockResolvedValue([{ vocabularyId: 1, count: 2 }]);
    reviewRepository.count.mockResolvedValue(4);
    comprehensionRepository.query.mockResolvedValue([]);
    quizRepository.query.mockResolvedValue([
      { attempts: 2, questions: 5, score: 4 },
    ]);
    vocabularyRepository.count.mockResolvedValue(3);
    vocabularyRepository.find.mockResolvedValue([
      {
        id: 1,
        expression: 'ruin',
        translationJa: '遺跡',
        lapseCount: 1,
      },
    ]);
    heritageRepository.find.mockResolvedValue([
      { uuid: 'site-1', nameEn: 'Historic Site' },
    ]);

    await expect(service.getWeekly()).resolves.toMatchObject({
      readSites: [
        { heritageSiteId: 'site-1', nameEn: 'Historic Site', count: 2 },
      ],
      newVocabulary: [{ id: 1, expression: 'ruin', translationJa: '遺跡' }],
      difficultVocabulary: [
        {
          id: 1,
          difficultReviews: 2,
          totalLapses: 1,
        },
      ],
      nextWeekReviewCount: 3,
      reviewCount: 4,
      quizAttempts: 2,
      quizAccuracy: 80,
    });
  });
});
