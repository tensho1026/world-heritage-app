import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorldHeritageSite } from '../../../database/entities/world-heritage-site.entity';
import { HeritageImportService } from './heritage-import.service';

describe('HeritageImportService', () => {
  let service: HeritageImportService;
  const repository = { upsert: jest.fn() };

  beforeEach(async () => {
    repository.upsert.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeritageImportService,
        {
          provide: getRepositoryToken(WorldHeritageSite),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<HeritageImportService>(HeritageImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('fetches and upserts pages until the results array is empty', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total_count: 1,
          results: [
            {
              uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
              id_no: '208',
              name_en: 'Bamiyan Valley',
              category: 'Cultural',
              coordinates: { lat: 34.84694, lon: 67.82525 },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 1, results: [] }),
      } as Response);

    await expect(service.importHeritages()).resolves.toEqual({
      importedCount: 1,
      totalCount: 1,
    });
    expect(repository.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
          unescoId: '208',
          nameEn: 'Bamiyan Valley',
          latitude: 34.84694,
          longitude: 67.82525,
        }),
      ],
      { conflictPaths: ['uuid'] },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('limit=100&offset=0'),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('limit=100&offset=100'),
    );
  });
});
