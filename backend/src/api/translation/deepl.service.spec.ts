import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { TranslationCache } from '../../database/entities/translation-cache.entity';
import { DeepLService } from './deepl.service';

describe('DeepLService', () => {
  const cacheRepository = {
    find: jest.fn(),
    create: jest.fn((value: object) => value),
    upsert: jest.fn(),
  };

  afterEach(() => jest.restoreAllMocks());

  it('uses cached translations without calling DeepL', async () => {
    cacheRepository.find.mockResolvedValue([
      {
        sourceTextHash: createHash('sha256')
          .update('World Heritage\u0000')
          .digest('hex'),
        translatedText: '世界遺産',
      },
    ]);
    const config = { get: jest.fn() } as unknown as ConfigService;
    const service = new DeepLService(
      cacheRepository as unknown as Repository<TranslationCache>,
      config,
    );
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(service.translateTexts(['World Heritage'])).resolves.toEqual([
      '世界遺産',
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('translates missing text and stores it in the cache', async () => {
    cacheRepository.find.mockResolvedValue([]);
    cacheRepository.upsert.mockResolvedValue(undefined);
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'DEEPL_API_KEY') return 'secret';
        if (key === 'DEEPL_API_BASE_URL') return 'https://api-free.deepl.com';
        return undefined;
      }),
    } as unknown as ConfigService;
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: '世界遺産' }] }),
    } as Response);
    const service = new DeepLService(
      cacheRepository as unknown as Repository<TranslationCache>,
      config,
    );

    await expect(service.translateTexts(['World Heritage'])).resolves.toEqual([
      '世界遺産',
    ]);
    expect(cacheRepository.upsert).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-free.deepl.com/v2/translate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('translates and caches duplicate text only once', async () => {
    cacheRepository.find.mockResolvedValue([]);
    cacheRepository.upsert.mockResolvedValue(undefined);
    const config = {
      get: jest.fn((key: string) =>
        key === 'DEEPL_API_KEY' ? 'secret' : undefined,
      ),
    } as unknown as ConfigService;
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: '世界遺産' }] }),
    } as Response);
    const service = new DeepLService(
      cacheRepository as unknown as Repository<TranslationCache>,
      config,
    );

    await expect(
      service.translateTexts(['World Heritage', 'World Heritage']),
    ).resolves.toEqual(['世界遺産', '世界遺産']);

    const request = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    ) as { text: string[] };
    expect(request.text).toEqual(['World Heritage']);
    expect(cacheRepository.upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ translatedText: '世界遺産' })],
      expect.any(Object),
    );
  });

  it('reports missing configuration without exposing a key', async () => {
    cacheRepository.find.mockResolvedValue([]);
    const config = { get: jest.fn() } as unknown as ConfigService;
    const service = new DeepLService(
      cacheRepository as unknown as Repository<TranslationCache>,
      config,
    );

    await expect(service.translateTexts(['hello'])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
