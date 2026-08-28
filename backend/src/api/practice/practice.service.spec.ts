import { Repository } from 'typeorm';
import { LearningExerciseAttempt } from '../../database/entities/learning-exercise-attempt.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { PracticeService } from './practice.service';

describe('PracticeService', () => {
  const attemptRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 1, ...value })),
  };
  const heritageRepository = { existsBy: jest.fn() };
  const service = new PracticeService(
    attemptRepository as unknown as Repository<LearningExerciseAttempt>,
    heritageRepository as unknown as Repository<WorldHeritageSite>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    heritageRepository.existsBy.mockResolvedValue(true);
  });

  it('records a bounded dictation result', async () => {
    await expect(
      service.create({
        heritageSiteId: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
        type: 'dictation',
        sourceSentenceEn: 'The monument was built in the twelfth century.',
        answerText: 'The monument was built in the 12th century.',
        score: 82,
        hintsUsed: 1,
        playbackCount: 3,
      }),
    ).resolves.toMatchObject({ id: 1, type: 'dictation', score: 82 });
  });

  it('rejects an out-of-range score', async () => {
    await expect(
      service.create({
        heritageSiteId: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
        type: 'writing',
        sourceSentenceEn: 'A valid sentence.',
        answerText: 'A valid answer.',
        score: 101,
      }),
    ).rejects.toThrow('score is invalid');
  });
});
