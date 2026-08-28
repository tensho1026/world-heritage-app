import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningExerciseAttempt } from '../../database/entities/learning-exercise-attempt.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningExerciseAttempt, WorldHeritageSite]),
  ],
  controllers: [PracticeController],
  providers: [PracticeService],
})
export class PracticeModule {}
