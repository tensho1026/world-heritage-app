import { Controller, Get, Query } from '@nestjs/common';
import { HeritageService } from './heritage.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller()
export class LibraryController {
  constructor(private readonly heritageService: HeritageService) {}

  @Get('favorites')
  getFavorites(@Query() query: PaginationQueryDto) {
    return this.heritageService.getFavorites(query.page, query.pageSize);
  }

  @Get('read-later')
  getReadLater(@Query() query: PaginationQueryDto) {
    return this.heritageService.getReadLater(query.page, query.pageSize);
  }

  @Get('history')
  getHistory(@Query() query: PaginationQueryDto) {
    return this.heritageService.getHistory(query.page, query.pageSize);
  }

  @Get('stats')
  getStats() {
    return this.heritageService.getStats();
  }
}
