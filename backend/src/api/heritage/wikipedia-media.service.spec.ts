import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  HeritageCategory,
  WorldHeritageSite,
} from '../../database/entities/world-heritage-site.entity';
import { WikipediaMediaService } from './wikipedia-media.service';

function createSite(overrides: Partial<WorldHeritageSite> = {}) {
  return {
    uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
    nameEn: 'Bamiyan Valley',
    category: HeritageCategory.CULTURAL,
    mainImageUrl: null,
    wikipediaImageUrl: null,
    wikipediaPageUrl: null,
    wikipediaImageFetchedAt: null,
    ...overrides,
  } as WorldHeritageSite;
}

describe('WikipediaMediaService', () => {
  const repository = { save: jest.fn(async (site: WorldHeritageSite) => site) };
  const config = { get: jest.fn() } as unknown as ConfigService;

  afterEach(() => jest.restoreAllMocks());

  it('does not query Wikipedia when UNESCO supplied an image', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = new WikipediaMediaService(
      repository as unknown as Repository<WorldHeritageSite>,
      config,
    );
    const site = createSite({
      mainImageUrl: 'https://unesco.example/image.jpg',
    });

    await expect(service.fillMissingImage(site)).resolves.toBe(site);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('stores a Wikipedia image and its source page as fallback', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: [
              {
                fullurl: 'https://en.wikipedia.org/wiki/Bamyan_Valley',
                pageimage: 'Bamyan.jpg',
                original: {
                  source: 'https://upload.wikimedia.org/image.jpg',
                },
              },
            ],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: [
              {
                imageinfo: [
                  {
                    extmetadata: {
                      Artist: { value: '<a>Example photographer</a>' },
                      LicenseShortName: { value: 'CC BY-SA 4.0' },
                    },
                  },
                ],
              },
            ],
          },
        }),
      } as Response);
    const service = new WikipediaMediaService(
      repository as unknown as Repository<WorldHeritageSite>,
      config,
    );
    const site = createSite();

    await expect(service.fillMissingImage(site)).resolves.toMatchObject({
      wikipediaImageUrl: 'https://upload.wikimedia.org/image.jpg',
      wikipediaPageUrl: 'https://en.wikipedia.org/wiki/Bamyan_Valley',
      wikipediaImageAuthor: 'Example photographer',
      wikipediaImageLicense: 'CC BY-SA 4.0',
    });
    expect(repository.save).toHaveBeenCalledWith(site);
  });
});
