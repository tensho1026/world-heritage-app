import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprehensionHistory } from '../../database/entities/comprehension-history.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularyReview } from '../../database/entities/vocabulary-review.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HeritageRead,
      SavedVocabulary,
      VocabularyReview,
      ComprehensionHistory,
      QuizAttempt,
      WorldHeritageSite,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
