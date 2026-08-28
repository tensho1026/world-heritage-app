import { DataSourceOptions } from 'typeorm';
import { WorldHeritageSite } from './entities/world-heritage-site.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { HeritageView } from './entities/heritage-view.entity';
import { HeritageRead } from './entities/heritage-read.entity';
import { HeritageLearningState } from './entities/heritage-learning-state.entity';
import { SavedVocabulary } from './entities/saved-vocabulary.entity';
import { VocabularySource } from './entities/vocabulary-source.entity';
import { TranslationCache } from './entities/translation-cache.entity';
import { ArticleHighlight } from './entities/article-highlight.entity';
import { VocabularyReview } from './entities/vocabulary-review.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { ComprehensionHistory } from './entities/comprehension-history.entity';
import { LearningExerciseAttempt } from './entities/learning-exercise-attempt.entity';
import { MonthlyChallenge } from './entities/monthly-challenge.entity';

export const databaseEntities = [
  WorldHeritageSite,
  HeritageView,
  HeritageRead,
  HeritageLearningState,
  SavedVocabulary,
  VocabularySource,
  TranslationCache,
  ArticleHighlight,
  VocabularyReview,
  QuizAttempt,
  ComprehensionHistory,
  LearningExerciseAttempt,
  MonthlyChallenge,
];

type SharedPostgresOptions = {
  type: 'postgres';
  url: string;
  entities: typeof databaseEntities;
  synchronize: boolean;
  ssl: true;
  extra?: {
    enableChannelBinding?: boolean;
  };
};

function createSharedPostgresOptions(
  databaseUrl: string,
  synchronize: boolean,
): SharedPostgresOptions {
  const enableChannelBinding = databaseUrl.includes('channel_binding=require');

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: databaseEntities,
    synchronize,
    ssl: true,
    extra: enableChannelBinding ? { enableChannelBinding: true } : undefined,
  };
}

export function createTypeOrmModuleOptions(
  databaseUrl: string,
  synchronize: boolean,
): TypeOrmModuleOptions {
  return {
    ...createSharedPostgresOptions(databaseUrl, synchronize),
    autoLoadEntities: true,
  };
}

export function createDataSourceOptions(
  databaseUrl: string,
  synchronize: boolean,
): DataSourceOptions {
  return createSharedPostgresOptions(
    databaseUrl,
    synchronize,
  ) as DataSourceOptions;
}
