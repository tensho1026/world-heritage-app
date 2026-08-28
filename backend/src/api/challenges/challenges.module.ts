import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule } from '../discovery/discovery.module';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { LearningExerciseAttempt } from '../../database/entities/learning-exercise-attempt.entity';
import { MonthlyChallenge } from '../../database/entities/monthly-challenge.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularyReview } from '../../database/entities/vocabulary-review.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';

@Module({
  imports: [
    DiscoveryModule,
    TypeOrmModule.forFeature([
      MonthlyChallenge,
      HeritageRead,
      WorldHeritageSite,
      SavedVocabulary,
      VocabularyReview,
      QuizAttempt,
      LearningExerciseAttempt,
    ]),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
})
export class ChallengesModule {}
