import { Controller, Get } from '@nestjs/common';
import { RandomHeritageService } from './random-heritage.service';

@Controller('random-heritage')
export class RandomHeritageController {
  constructor(private readonly randomHeritageService: RandomHeritageService) {}

  @Get()
  async GetrandomHeritage() {
    return await this.randomHeritageService.getRandomHeritage();
  }
}
