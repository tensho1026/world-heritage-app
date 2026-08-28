import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LearningExerciseAttempt,
  LearningExerciseType,
} from '../../database/entities/learning-exercise-attempt.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

export type CreatePracticeAttempt = {
  heritageSiteId?: unknown;
  type?: unknown;
  sourceSentenceEn?: unknown;
  answerText?: unknown;
  score?: unknown;
  hintsUsed?: unknown;
  playbackCount?: unknown;
};

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(LearningExerciseAttempt)
    private readonly attemptRepository: Repository<LearningExerciseAttempt>,
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
  ) {}

  async create(input: CreatePracticeAttempt) {
    const heritageSiteId = this.requiredString(
      input.heritageSiteId,
      'heritageSiteId',
      50,
    );
    if (!(await this.heritageRepository.existsBy({ uuid: heritageSiteId }))) {
      throw new NotFoundException('World Heritage site was not found.');
    }
    if (!Object.values(LearningExerciseType).includes(input.type as never)) {
      throw new BadRequestException('Invalid exercise type.');
    }
    const score = this.integer(input.score, 'score', 0, 100);
    const attempt = this.attemptRepository.create({
      heritageSiteId,
      type: input.type as LearningExerciseType,
      sourceSentenceEn: this.requiredString(
        input.sourceSentenceEn,
        'sourceSentenceEn',
        2_000,
      ),
      answerText: this.requiredString(input.answerText, 'answerText', 2_000),
      score,
      hintsUsed: this.integer(input.hintsUsed ?? 0, 'hintsUsed', 0, 20),
      playbackCount: this.integer(
        input.playbackCount ?? 0,
        'playbackCount',
        0,
        100,
      ),
    });
    return this.attemptRepository.save(attempt);
  }

  private requiredString(value: unknown, name: string, max: number) {
    if (typeof value !== 'string' || !value.trim() || value.length > max) {
      throw new BadRequestException(`${name} is invalid.`);
    }
    return value.trim();
  }

  private integer(value: unknown, name: string, min: number, max: number) {
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < min ||
      value > max
    ) {
      throw new BadRequestException(`${name} is invalid.`);
    }
    return value;
  }
}
