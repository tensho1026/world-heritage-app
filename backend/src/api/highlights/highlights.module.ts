import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleHighlight } from '../../database/entities/article-highlight.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { HighlightsController } from './highlights.controller';
import { HighlightsService } from './highlights.service';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleHighlight, WorldHeritageSite])],
  controllers: [HighlightsController],
  providers: [HighlightsService],
})
export class HighlightsModule {}
