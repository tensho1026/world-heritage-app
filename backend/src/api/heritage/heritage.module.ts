import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeritageLearningState } from '../../database/entities/heritage-learning-state.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { HeritageView } from '../../database/entities/heritage-view.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { HeritageController } from './heritage.controller';
import { HeritageService } from './heritage.service';
import { LibraryController } from './library.controller';
import { WikipediaMediaService } from './wikipedia-media.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorldHeritageSite,
      HeritageView,
      HeritageRead,
      HeritageLearningState,
      SavedVocabulary,
    ]),
  ],
  controllers: [HeritageController, LibraryController],
  providers: [HeritageService, WikipediaMediaService],
  exports: [HeritageService],
})
export class HeritageModule {}
