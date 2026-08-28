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
} from '@nestjs/common';
import { HighlightsService, SaveHighlightInput } from './highlights.service';

@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get('site/:heritageSiteId')
  getForSite(@Param('heritageSiteId') heritageSiteId: string) {
    return this.highlightsService.getForSite(heritageSiteId);
  }

  @Post()
  create(@Body() input: SaveHighlightInput) {
    return this.highlightsService.create(input);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: Partial<SaveHighlightInput>,
  ) {
    return this.highlightsService.update(id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.highlightsService.remove(id);
  }
}
