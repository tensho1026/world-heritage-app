import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Redirect,
} from '@nestjs/common';
import { ComprehensionLevel } from '../../database/entities/heritage-learning-state.entity';
import { HeritageMode, HeritageService } from './heritage.service';

@Controller('heritage')
export class HeritageController {
  constructor(private readonly heritageService: HeritageService) {}

  @Get('random')
  @Header('Cache-Control', 'no-store')
  getRandom(
    @Query('mode') requestedMode?: string,
    @Query('exclude') exclude?: string,
  ) {
    const mode: HeritageMode = requestedMode === 'famous' ? 'famous' : 'all';
    return this.heritageService.getRandom(mode, exclude);
  }

  @Get(':id/image')
  @Redirect()
  @Header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  async getImage(@Param('id') id: string, @Query('width') requestedWidth?: string) {
    const width = requestedWidth === '320' || requestedWidth === '480'
      ? Number(requestedWidth)
      : 960;
    return {
      url: await this.heritageService.getImageUrl(id, width),
      statusCode: 302,
    };
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.heritageService.getById(id);
  }

  @Post(':id/views')
  recordView(@Param('id') id: string) {
    return this.heritageService.recordView(id);
  }

  @Post(':id/reads')
  recordRead(@Param('id') id: string) {
    return this.heritageService.recordRead(id);
  }

  @Delete(':id/reads/:readId')
  @HttpCode(204)
  undoRead(
    @Param('id') id: string,
    @Param('readId', ParseIntPipe) readId: number,
  ) {
    return this.heritageService.undoRead(id, readId);
  }

  @Get(':id/learning-state')
  getLearningState(@Param('id') id: string) {
    return this.heritageService.getLearningState(id);
  }

  @Patch(':id/comprehension')
  updateComprehension(
    @Param('id') id: string,
    @Body('comprehensionLevel') comprehensionLevel: ComprehensionLevel | null,
  ) {
    return this.heritageService.updateComprehension(id, comprehensionLevel);
  }

  @Put(':id/favorite')
  setFavorite(@Param('id') id: string) {
    return this.heritageService.setFavorite(id, true);
  }

  @Delete(':id/favorite')
  setNotFavorite(@Param('id') id: string) {
    return this.heritageService.setFavorite(id, false);
  }

  @Put(':id/read-later')
  setReadLater(@Param('id') id: string) {
    return this.heritageService.setReadLater(id, true);
  }

  @Delete(':id/read-later')
  setNotReadLater(@Param('id') id: string) {
    return this.heritageService.setReadLater(id, false);
  }
}
