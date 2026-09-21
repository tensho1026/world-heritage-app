import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  HeritageCategory,
  WorldHeritageSite,
} from '../../database/entities/world-heritage-site.entity';
import { HeritagePdfService } from './heritage-pdf.service';
import { WikipediaMediaService } from './wikipedia-media.service';

function createSite(overrides: Partial<WorldHeritageSite> = {}) {
  return {
    uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
    unescoId: '123',
    nameEn: 'Bamiyan Valley',
    nameJa: 'バーミヤン渓谷',
    category: HeritageCategory.CULTURAL,
    statesNames: ['Afghanistan'],
    region: 'Asia and the Pacific',
    dateInscribed: 2003,
    shortDescriptionEn: 'A cultural landscape in the central highlands.',
    shortDescriptionJa: '中央高地に広がる文化的景観。',
    descriptionEn: 'The valley contains archaeological remains and landscapes.',
    descriptionJa: 'この渓谷には考古学的遺構と景観が残されています。',
    justificationEn: 'It bears testimony to a long cultural tradition.',
    justificationJa: '長い文化的伝統を伝えています。',
    criteriaText: 'The site meets criteria (i), (ii), and (iii).',
    criteriaTextJa: '登録基準（i）、（ii）、（iii）を満たしています。',
    mainImageUrl: null,
    mainImageAuthor: null,
    mainImageSourceUrl: null,
    mainImageLicense: null,
    mainImageCaptionEn: null,
    wikipediaImageUrl: null,
    wikipediaPageUrl: 'https://en.wikipedia.org/wiki/Bamyan_Valley',
    wikipediaImageAuthor: 'Example photographer',
    wikipediaImageLicense: 'CC BY-SA 4.0',
    ...overrides,
  } as WorldHeritageSite;
}

describe('HeritagePdfService', () => {
  it('generates a Japanese PDF after enriching the site image', async () => {
    const site = createSite();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(site),
    };
    const wikipediaMediaService = {
      fillMissingImage: jest.fn(async (value: WorldHeritageSite) => value),
      getDisplayImageUrl: jest.fn(() => null),
    };
    const service = new HeritagePdfService(
      repository as unknown as Repository<WorldHeritageSite>,
      wikipediaMediaService as unknown as WikipediaMediaService,
    );

    const result = await service.createPdf(site.uuid, 'ja');

    expect(result.filename).toBe('Bamiyan Valley.pdf');
    expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(result.buffer.length).toBeGreaterThan(10_000);
    expect(repository.findOneBy).toHaveBeenCalledWith({ uuid: site.uuid });
    expect(wikipediaMediaService.fillMissingImage).toHaveBeenCalledWith(site);
    expect(wikipediaMediaService.getDisplayImageUrl).toHaveBeenCalledWith(
      site,
      960,
    );
  });

  it('keeps the PDF export available when no image can be embedded', async () => {
    const site = createSite({
      nameEn: 'Site / with unsafe:file name',
      wikipediaPageUrl: null,
      wikipediaImageAuthor: null,
      wikipediaImageLicense: null,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(site),
    };
    const wikipediaMediaService = {
      fillMissingImage: jest.fn(async (value: WorldHeritageSite) => value),
      getDisplayImageUrl: jest.fn(() => null),
    };
    const service = new HeritagePdfService(
      repository as unknown as Repository<WorldHeritageSite>,
      wikipediaMediaService as unknown as WikipediaMediaService,
    );

    const result = await service.createPdf(site.uuid, 'en');

    expect(result.filename).toBe('Site with unsafe file name.pdf');
    expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('embeds an available image in the PDF', async () => {
    const site = createSite();
    const image = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => image,
    } as unknown as Response);
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(site),
    };
    const wikipediaMediaService = {
      fillMissingImage: jest.fn(async (value: WorldHeritageSite) => value),
      getDisplayImageUrl: jest.fn(
        () => 'https://upload.wikimedia.org/image.png',
      ),
    };
    const service = new HeritagePdfService(
      repository as unknown as Repository<WorldHeritageSite>,
      wikipediaMediaService as unknown as WikipediaMediaService,
    );

    const result = await service.createPdf(site.uuid, 'both');

    expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://upload.wikimedia.org/image.png',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('throws when the site does not exist', async () => {
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new HeritagePdfService(
      repository as unknown as Repository<WorldHeritageSite>,
      {} as WikipediaMediaService,
    );

    await expect(service.createPdf('missing', 'both')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
