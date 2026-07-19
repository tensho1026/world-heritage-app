import { Test, TestingModule } from '@nestjs/testing';
import { HeritageImportService } from './heritage-import.service';

describe('HeritageImportService', () => {
  let service: HeritageImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeritageImportService],
    }).compile();

    service = module.get<HeritageImportService>(HeritageImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
