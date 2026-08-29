import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { TranslationCache } from '../../database/entities/translation-cache.entity';
import { LibreTranslateService } from './libretranslate.service';

describe('LibreTranslateService', () => {
  const cacheRepository = {
    find: jest.fn(),
    create: jest.fn((value: object) => value),
    upsert: jest.fn(),
  };

  afterEach(() => jest.restoreAllMocks());

  it('uses stored LibreTranslate results without making a request', async () => {
    cacheRepository.find.mockResolvedValue([
      {
        sourceTextHash: createHash('sha256')
          .update('World Heritage')
          .digest('hex'),
        translatedText: '世界遺産',
      },
    ]);
    const service = new LibreTranslateService(
      cacheRepository as unknown as Repository<TranslationCache>,
      { get: jest.fn() } as unknown as ConfigService,
    );
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(service.translateTexts(['World Heritage'])).resolves.toEqual([
      '世界遺産',
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('translates missing text and stores it in the provider cache', async () => {
    cacheRepository.find.mockResolvedValue([]);
    cacheRepository.upsert.mockResolvedValue(undefined);
    const config = {
      get: jest.fn((key: string) =>
        key === 'LIBRETRANSLATE_URL' ? 'http://translator:5000/' : undefined,
      ),
    } as unknown as ConfigService;
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: ['世界遺産'] }),
    } as Response);
    const service = new LibreTranslateService(
      cacheRepository as unknown as Repository<TranslationCache>,
      config,
    );

    await expect(service.translateTexts(['World Heritage'])).resolves.toEqual([
      '世界遺産',
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://translator:5000/translate',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(cacheRepository.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          provider: 'libretranslate',
          translatedText: '世界遺産',
        }),
      ],
      expect.any(Object),
    );
  });
});
