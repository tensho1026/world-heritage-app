import 'dotenv/config';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './typeorm.options';
import { AddLearningFeatures1760000000000 } from './migrations/1760000000000-AddLearningFeatures';
import { SeedFeaturedSites1760000001000 } from './migrations/1760000001000-SeedFeaturedSites';
import { AddVocabularyLearningStates1760000002000 } from './migrations/1760000002000-AddVocabularyLearningStates';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run database migrations');
}

export default new DataSource({
  ...createDataSourceOptions(databaseUrl, false),
  migrations: [
    AddLearningFeatures1760000000000,
    SeedFeaturedSites1760000001000,
    AddVocabularyLearningStates1760000002000,
  ],
});
