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
import { VocabularyService } from './vocabulary.service';
import {
  RecordVocabularyReviewDto,
  SaveVocabularyDto,
  UpdateVocabularyLearningStateDto,
  VocabularyQueryDto,
} from './vocabulary.dto';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  getAll(@Query() query: VocabularyQueryDto) {
    return this.vocabularyService.getAll(
      query.search,
      query.sort,
      query.heritageSiteId,
      query.memorization,
      query.uncertain,
      query.page,
      query.pageSize,
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
  save(@Body() input: SaveVocabularyDto) {
    return this.vocabularyService.save(input);
  }

  @Patch(':id/learning-state')
  updateLearningState(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    changes: UpdateVocabularyLearningStateDto,
  ) {
    return this.vocabularyService.updateLearningState(id, changes);
  }

  @Post(':id/reviews')
  recordReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: RecordVocabularyReviewDto,
  ) {
    return this.vocabularyService.recordReview(id, input.rating);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vocabularyService.remove(id);
  }
}
