import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto, UpdateHighlightDto } from './highlights.dto';

@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get('site/:heritageSiteId')
  getForSite(@Param('heritageSiteId', ParseUUIDPipe) heritageSiteId: string) {
    return this.highlightsService.getForSite(heritageSiteId);
  }

  @Post()
  create(@Body() input: CreateHighlightDto) {
    return this.highlightsService.create(input);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateHighlightDto,
  ) {
    return this.highlightsService.update(id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.highlightsService.remove(id);
  }
}
