import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorldHeritageSite, QuizAttempt])],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
