import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SaveVocabularyInput, VocabularyService } from './vocabulary.service';
import { VocabularyReviewRating } from '../../database/entities/vocabulary-review.entity';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  getAll(
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('heritageSiteId') heritageSiteId?: string,
    @Query('memorization') memorization?: string,
    @Query('uncertain') uncertain?: string,
  ) {
    return this.vocabularyService.getAll(
      search,
      sort,
      heritageSiteId,
      memorization,
      uncertain,
    );
  }

  @Get('count')
  async count() {
    return { count: await this.vocabularyService.count() };
  }

  @Get('review/due')
  getDueReviews() {
    return this.vocabularyService.getDueReviews();
  }

  @Get('review/summary')
  getReviewSummary() {
    return this.vocabularyService.getReviewSummary();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.vocabularyService.getOne(id);
  }

  @Post()
  save(@Body() input: SaveVocabularyInput) {
    return this.vocabularyService.save(input);
  }

  @Patch(':id/learning-state')
  updateLearningState(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    changes: { isInMemorization?: unknown; isUncertain?: unknown },
  ) {
    return this.vocabularyService.updateLearningState(id, changes);
  }

  @Post(':id/reviews')
  recordReview(
    @Param('id', ParseIntPipe) id: number,
    @Body('rating') rating: VocabularyReviewRating,
  ) {
    return this.vocabularyService.recordReview(id, rating);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vocabularyService.remove(id);
  }
}
