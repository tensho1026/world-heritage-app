import { Repository } from 'typeorm';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import {
  HeritageCategory,
  WorldHeritageSite,
} from '../../database/entities/world-heritage-site.entity';
import { QuizService } from './quiz.service';

describe('QuizService', () => {
  const site = {
    uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
    unescoId: '208',
    nameEn: 'Test Heritage Site',
    category: HeritageCategory.CULTURAL,
    statesNames: ['Japan'],
    dateInscribed: 1995,
    danger: false,
    justificationEn: 'The site is important evidence of cultural exchange.',
    criteriaText: '(i)(ii)',
  } as WorldHeritageSite;
  const distractors = [
    {
      uuid: 'b1d7e93d-f865-53f4-a76b-0c7895273013',
      unescoId: '209',
      statesNames: ['France'],
      justificationEn: 'A major example of palace architecture.',
    },
    {
      uuid: 'c1d7e93d-f865-53f4-a76b-0c7895273013',
      unescoId: '210',
      statesNames: ['Peru'],
      justificationEn: 'A landscape with exceptional biodiversity.',
    },
    {
      uuid: 'd1d7e93d-f865-53f4-a76b-0c7895273013',
      unescoId: '211',
      statesNames: ['Egypt'],
      justificationEn: 'Monuments demonstrate an ancient civilization.',
    },
  ] as WorldHeritageSite[];
  const heritageRepository = {
    findOneBy: jest.fn(),
    find: jest.fn(),
  };
  const attemptRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: 1,
      completedAt: new Date('2026-08-23T00:00:00Z'),
      ...value,
    })),
  };
  const service = new QuizService(
    heritageRepository as unknown as Repository<WorldHeritageSite>,
    attemptRepository as unknown as Repository<QuizAttempt>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    heritageRepository.findOneBy.mockResolvedValue(site);
    heritageRepository.find.mockResolvedValue(distractors);
  });

  it('builds five English questions including true/false and evidence', async () => {
    const quiz = await service.getQuiz(site.uuid);
    expect(quiz.questions).toHaveLength(5);
    expect(quiz.questions.some((item) => item.type === 'true-false')).toBe(
      true,
    );
    expect(quiz.questions.every((item) => item.evidence)).toBe(true);
  });

  it('scores and records an attempt', async () => {
    const quiz = await service.getQuiz(site.uuid);
    const answers = Object.fromEntries(
      quiz.questions.map((question) => [question.id, question.correctAnswer]),
    );
    const result = await service.submit(site.uuid, answers);
    expect(result.score).toBe(5);
    expect(result.results.every((item) => item.correct)).toBe(true);
    expect(attemptRepository.save).toHaveBeenCalled();
  });
});
