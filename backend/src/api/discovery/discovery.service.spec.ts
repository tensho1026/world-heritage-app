import { Repository } from 'typeorm';
import { HeritageLearningState } from '../../database/entities/heritage-learning-state.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import {
  HeritageCategory,
  WorldHeritageSite,
} from '../../database/entities/world-heritage-site.entity';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService progress and timeline', () => {
  const heritageQuery = {
    andWhere: jest.fn(),
    select: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    limit: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };
  const heritageRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
    createQueryBuilder: jest.fn(() => heritageQuery),
  };
  const learningRepository = { findBy: jest.fn() };
  const readQuery = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
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
    readQuery.addSelect.mockReturnValue(readQuery);
    readQuery.where.mockReturnValue(readQuery);
    readQuery.groupBy.mockReturnValue(readQuery);
    heritageQuery.andWhere.mockReturnValue(heritageQuery);
    heritageQuery.select.mockReturnValue(heritageQuery);
    heritageQuery.orderBy.mockReturnValue(heritageQuery);
    heritageQuery.addOrderBy.mockReturnValue(heritageQuery);
    heritageQuery.skip.mockReturnValue(heritageQuery);
    heritageQuery.take.mockReturnValue(heritageQuery);
    heritageQuery.limit.mockReturnValue(heritageQuery);
    learningRepository.findBy.mockResolvedValue([]);
    readQuery.getRawMany.mockResolvedValue([]);
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
    heritageQuery.getMany.mockResolvedValue([
      { ...shared, historicalPeriods: periods },
    ]);
    await expect(service.getTimeline({})).resolves.toEqual([
      expect.objectContaining({ historicalPeriods: periods }),
    ]);
  });

  it('returns a bounded discovery page with total metadata', async () => {
    heritageQuery.getManyAndCount.mockResolvedValue([[shared], 1_248]);

    await expect(
      service.searchPage({ page: '2', pageSize: '24' }),
    ).resolves.toMatchObject({
      total: 1_248,
      page: 2,
      pageSize: 24,
      totalPages: 52,
      items: [expect.objectContaining({ uuid: shared.uuid })],
    });
    expect(heritageQuery.skip).toHaveBeenCalledWith(24);
    expect(heritageQuery.take).toHaveBeenCalledWith(24);
  });

  it('selects one random match in the database', async () => {
    heritageQuery.getOne.mockResolvedValue(shared);

    await expect(service.getRandom({})).resolves.toMatchObject({
      uuid: shared.uuid,
    });
    expect(heritageQuery.orderBy).toHaveBeenCalledWith('RANDOM()');
    expect(heritageQuery.limit).toHaveBeenCalledWith(1);
  });
});
