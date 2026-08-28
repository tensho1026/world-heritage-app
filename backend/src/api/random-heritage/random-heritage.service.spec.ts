import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { RandomHeritageService } from './random-heritage.service';

describe('RandomHeritageService', () => {
  let service: RandomHeritageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RandomHeritageService,
        {
          provide: getRepositoryToken(WorldHeritageSite),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RandomHeritageService>(RandomHeritageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
