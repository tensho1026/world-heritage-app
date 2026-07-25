import { Test, TestingModule } from '@nestjs/testing';
import { RandomHeritageService } from './random-heritage.service';

describe('RandomHeritageService', () => {
  let service: RandomHeritageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RandomHeritageService],
    }).compile();

    service = module.get<RandomHeritageService>(RandomHeritageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
