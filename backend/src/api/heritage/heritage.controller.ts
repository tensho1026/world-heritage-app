import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Redirect,
} from '@nestjs/common';
import { HeritageService } from './heritage.service';
import { RandomHeritageQueryDto, UpdateComprehensionDto } from './heritage.dto';

@Controller('heritage')
export class HeritageController {
  constructor(private readonly heritageService: HeritageService) {}

  @Get('random')
  @Header('Cache-Control', 'no-store')
  getRandom(@Query() query: RandomHeritageQueryDto) {
    return this.heritageService.getRandom(query.mode ?? 'all', query.exclude);
  }

  @Get(':id/image')
  @Redirect()
  @Header(
    'Cache-Control',
    'public, max-age=86400, stale-while-revalidate=604800',
  )
  async getImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('width') requestedWidth?: string,
  ) {
    const width =
      requestedWidth === '320' || requestedWidth === '480'
        ? Number(requestedWidth)
        : 960;
    return {
      url: await this.heritageService.getImageUrl(id, width),
      statusCode: 302,
    };
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.getById(id);
  }

  @Post(':id/views')
  recordView(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.recordView(id);
  }

  @Post(':id/reads')
  recordRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.recordRead(id);
  }

  @Delete(':id/reads/:readId')
  @HttpCode(204)
  undoRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('readId', ParseIntPipe) readId: number,
  ) {
    return this.heritageService.undoRead(id, readId);
  }

  @Get(':id/learning-state')
  getLearningState(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.getLearningState(id);
  }

  @Patch(':id/comprehension')
  updateComprehension(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateComprehensionDto,
  ) {
    return this.heritageService.updateComprehension(
      id,
      input.comprehensionLevel,
    );
  }

  @Put(':id/favorite')
  setFavorite(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.setFavorite(id, true);
  }

  @Delete(':id/favorite')
  setNotFavorite(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.setFavorite(id, false);
  }

  @Put(':id/read-later')
  setReadLater(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.setReadLater(id, true);
  }

  @Delete(':id/read-later')
  setNotReadLater(@Param('id', ParseUUIDPipe) id: string) {
    return this.heritageService.setReadLater(id, false);
  }
}
