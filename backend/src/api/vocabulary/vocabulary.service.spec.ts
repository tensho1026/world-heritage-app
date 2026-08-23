import { Repository } from 'typeorm';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularySource } from '../../database/entities/vocabulary-source.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { VocabularyService } from './vocabulary.service';

describe('VocabularyService learning states', () => {
  const vocabulary = {
    id: 1,
    expression: 'inscribed',
    normalizedExpression: 'inscribed',
    translationJa: '登録された',
    isInMemorization: true,
    isUncertain: true,
  } as SavedVocabulary;
  const vocabularyRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const sourceRepository = { find: jest.fn() };
  const heritageRepository = { findBy: jest.fn() };
  const service = new VocabularyService(
    vocabularyRepository as unknown as Repository<SavedVocabulary>,
    sourceRepository as unknown as Repository<VocabularySource>,
    heritageRepository as unknown as Repository<WorldHeritageSite>,
  );

  beforeEach(() => {
    vocabularyRepository.findOneBy.mockResolvedValue({ ...vocabulary });
    vocabularyRepository.save.mockImplementation(async (value) => value);
    sourceRepository.find.mockResolvedValue([]);
    heritageRepository.findBy.mockResolvedValue([]);
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
