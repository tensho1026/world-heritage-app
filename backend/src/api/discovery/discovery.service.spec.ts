import { Repository } from 'typeorm';
import { HeritageLearningState } from '../../database/entities/heritage-learning-state.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import {
  HeritageCategory,
  WorldHeritageSite,
} from '../../database/entities/world-heritage-site.entity';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService progress and timeline', () => {
  const heritageRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
  };
  const learningRepository = {};
  const readQuery = {
    select: jest.fn(),
    getRawMany: jest.fn(),
  };
  readQuery.select.mockReturnValue(readQuery);
  const readRepository = { createQueryBuilder: jest.fn(() => readQuery) };
  const service = new DiscoveryService(
    heritageRepository as unknown as Repository<WorldHeritageSite>,
    learningRepository as unknown as Repository<HeritageLearningState>,
    readRepository as unknown as Repository<HeritageRead>,
  );
  const shared = {
    uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
    unescoId: '208',
    nameEn: 'Shared Heritage',
    statesNames: ['France', 'Germany'],
    isoCodes: ['FR', 'DE'],
    region: 'Europe and North America',
    category: HeritageCategory.CULTURAL,
    historicalPeriodStart: null,
    historicalPeriods: [],
  } as unknown as WorldHeritageSite;

  beforeEach(() => {
    jest.clearAllMocks();
    readQuery.select.mockReturnValue(readQuery);
  });

  it('counts a transboundary site once per country and ignores rereads', async () => {
    heritageRepository.find.mockResolvedValue([shared]);
    readQuery.getRawMany.mockResolvedValue([
      { heritageSiteId: shared.uuid },
      { heritageSiteId: shared.uuid },
    ]);
    const progress = await service.getProgress();
    expect(progress.readSites).toBe(1);
    expect(progress.countries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ isoCode: 'FR', total: 1, read: 1 }),
        expect.objectContaining({ isoCode: 'DE', total: 1, read: 1 }),
      ]),
    );
    expect(progress.regions[0]).toMatchObject({ total: 1, read: 1 });
  });

  it('returns every sourced historical period for the same site', async () => {
    const periods = [
      {
        start: -500,
        end: -401,
        label: '5th century BCE',
        type: 'settlement',
        sourceUrl: 'https://whc.unesco.org/en/list/208',
        approximate: true,
        verified: true,
      },
      {
        start: 1200,
        end: 1250,
        label: 'Reconstruction',
        type: 'reconstruction',
        sourceUrl: 'https://whc.unesco.org/en/list/208',
        approximate: true,
        verified: true,
      },
    ];
    jest.spyOn(service, 'search').mockResolvedValue([
      {
        uuid: shared.uuid,
        nameEn: shared.nameEn,
      },
    ] as Awaited<ReturnType<DiscoveryService['search']>>);
    heritageRepository.findBy.mockResolvedValue([
      { ...shared, historicalPeriods: periods },
    ]);
    await expect(service.getTimeline({})).resolves.toEqual([
      expect.objectContaining({ historicalPeriods: periods }),
    ]);
  });
});
