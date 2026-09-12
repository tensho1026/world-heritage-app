import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { TranslationRateLimit } from '../../database/entities/translation-rate-limit.entity';
import { TranslationRateLimitService } from './translation-rate-limit.service';

describe('TranslationRateLimitService', () => {
  const repository = { query: jest.fn() };
  const config = {
    get: jest.fn(() => '2'),
  } as unknown as ConfigService;
  const service = new TranslationRateLimitService(
    repository as unknown as Repository<TranslationRateLimit>,
    config,
  );

  beforeEach(() => jest.clearAllMocks());

  it('uses an atomic shared database counter', async () => {
    repository.query.mockResolvedValue([{ requestCount: 1 }]);
    await expect(
      service.consume('127.0.0.1', 'selection'),
    ).resolves.toBeUndefined();
    expect(repository.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT'),
      [expect.stringMatching(/^[0-9a-f]{64}$/)],
    );
  });

  it('returns a retry time when the shared limit is exceeded', async () => {
    repository.query.mockResolvedValue([{ requestCount: 3 }]);
    await expect(
      service.consume('127.0.0.1', 'selection'),
    ).rejects.toMatchObject<Partial<HttpException>>({ status: 429 });
  });
});
