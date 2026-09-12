import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { selectRandomByUuid } from '../../database/random-selection';

@Injectable()
export class RandomHeritageService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
  ) {}

  async getRandomHeritage() {
    return selectRandomByUuid(() =>
      this.heritageRepository.createQueryBuilder('site'),
    );
  }
}
