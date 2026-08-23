import { Repository } from 'typeorm';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularySource } from '../../database/entities/vocabulary-source.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { VocabularyService } from './vocabulary.service';
import { VocabularyReview } from '../../database/entities/vocabulary-review.entity';
import { VocabularyReviewRating } from '../../database/entities/vocabulary-review.entity';

describe('VocabularyService learning states', () => {
  const vocabulary = {
    id: 1,
    expression: 'inscribed',
    normalizedExpression: 'inscribed',
    translationJa: '登録された',
    isInMemorization: true,
    isUncertain: true,
    nextReviewAt: new Date('2026-08-23T00:00:00Z'),
    reviewIntervalDays: 0,
    reviewEaseFactor: 2.5,
    reviewCount: 0,
    lapseCount: 0,
    lastReviewedAt: null,
  } as SavedVocabulary;
  const vocabularyRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const sourceRepository = { find: jest.fn() };
  const heritageRepository = { findBy: jest.fn() };
  const reviewRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const service = new VocabularyService(
    vocabularyRepository as unknown as Repository<SavedVocabulary>,
    sourceRepository as unknown as Repository<VocabularySource>,
    heritageRepository as unknown as Repository<WorldHeritageSite>,
    reviewRepository as unknown as Repository<VocabularyReview>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    vocabularyRepository.findOneBy.mockResolvedValue({ ...vocabulary });
    vocabularyRepository.save.mockImplementation(async (value) => value);
    sourceRepository.find.mockResolvedValue([]);
    heritageRepository.findBy.mockResolvedValue([]);
  });

  it('schedules a hard card for the next day and records the review', async () => {
    const result = await service.recordReview(1, VocabularyReviewRating.HARD);

    expect(result).toMatchObject({
      reviewCount: 1,
      reviewIntervalDays: 1,
      isInMemorization: true,
      isUncertain: true,
    });
    expect(reviewRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: VocabularyReviewRating.HARD,
        nextIntervalDays: 1,
      }),
    );
  });

  it('removes a word from memorization without clearing uncertainty', async () => {
    await service.updateLearningState(1, {
      isInMemorization: false,
    });

    expect(vocabularyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        isInMemorization: false,
        isUncertain: true,
      }),
    );
  });

  it('clears uncertainty without removing the memorization card', async () => {
    await service.updateLearningState(1, { isUncertain: false });

    expect(vocabularyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        isInMemorization: true,
        isUncertain: false,
      }),
    );
  });
});
