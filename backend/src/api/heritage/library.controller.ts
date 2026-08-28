import { Controller, Get } from '@nestjs/common';
import { HeritageService } from './heritage.service';

@Controller()
export class LibraryController {
  constructor(private readonly heritageService: HeritageService) {}

  @Get('favorites')
  getFavorites() {
    return this.heritageService.getFavorites();
  }

  @Get('read-later')
  getReadLater() {
    return this.heritageService.getReadLater();
  }

  @Get('history')
  getHistory() {
    return this.heritageService.getHistory();
  }

  @Get('stats')
  getStats() {
    return this.heritageService.getStats();
  }
}
