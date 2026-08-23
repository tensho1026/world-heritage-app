import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { VocabularySource } from '../../database/entities/vocabulary-source.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SavedVocabulary,
      VocabularySource,
      WorldHeritageSite,
    ]),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
})
export class VocabularyModule {}
