import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RandomHeritageService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
  ) {}

  async getRandomHeritage() {
    return await this.heritageRepository
      .createQueryBuilder('site')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }
}
