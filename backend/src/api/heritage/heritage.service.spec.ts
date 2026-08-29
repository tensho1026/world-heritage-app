import { Repository } from 'typeorm';
import { HeritageLearningState } from '../../database/entities/heritage-learning-state.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { HeritageView } from '../../database/entities/heritage-view.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import {
  HeritageCategory,
  WorldHeritageSite,
} from '../../database/entities/world-heritage-site.entity';
import { HeritageService } from './heritage.service';
import { WikipediaMediaService } from './wikipedia-media.service';
import { ComprehensionHistory } from '../../database/entities/comprehension-history.entity';

function randomQuery(result: WorldHeritageSite | null) {
  return {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
}

describe('HeritageService random selection', () => {
  it('reuses the sole candidate when excluding it leaves no result', async () => {
    const site = {
      uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
      nameEn: 'Only featured site',
      category: HeritageCategory.CULTURAL,
    } as WorldHeritageSite;
    const firstQuery = randomQuery(null);
    const fallbackQuery = randomQuery(site);
    const heritageRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(firstQuery)
        .mockReturnValueOnce(fallbackQuery),
    };
    const wikipediaMediaService = {
      fillMissingImage: jest.fn(async (value: WorldHeritageSite) => value),
      getWikipediaDisplayImageUrl: jest.fn(() => null),
    };
    const service = new HeritageService(
      heritageRepository as unknown as Repository<WorldHeritageSite>,
      {} as unknown as Repository<HeritageView>,
      {} as unknown as Repository<HeritageRead>,
      {} as unknown as Repository<HeritageLearningState>,
      {} as unknown as Repository<SavedVocabulary>,
      {} as unknown as Repository<ComprehensionHistory>,
      wikipediaMediaService as unknown as WikipediaMediaService,
    );

    await expect(service.getRandom('famous', site.uuid)).resolves.toMatchObject(
      { uuid: site.uuid },
    );
    expect(heritageRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
    expect(firstQuery.andWhere).toHaveBeenCalledWith('site.uuid != :exclude', {
      exclude: site.uuid,
    });
    expect(wikipediaMediaService.fillMissingImage).toHaveBeenCalledWith(site);
  });
});
