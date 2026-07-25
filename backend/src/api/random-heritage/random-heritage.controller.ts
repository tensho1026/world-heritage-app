import { Controller, Get, Header } from '@nestjs/common';
import { RandomHeritageService } from './random-heritage.service';

@Controller('random-heritage')
export class RandomHeritageController {
  constructor(private readonly randomHeritageService: RandomHeritageService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async GetrandomHeritage() {
    return await this.randomHeritageService.getRandomHeritage();
  }
}
