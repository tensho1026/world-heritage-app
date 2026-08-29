import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { TranslationCache } from '../../database/entities/translation-cache.entity';

type DeepLResponse = {
  translations?: Array<{ text?: string }>;
  message?: string;
};

@Injectable()
export class DeepLService {
  private requestTimestamps: number[] = [];

  constructor(
    @InjectRepository(TranslationCache)
    private readonly cacheRepository: Repository<TranslationCache>,
    private readonly configService: ConfigService,
  ) {}

  async translateTexts(texts: string[], context?: string): Promise<string[]> {
    if (!texts.length) return [];

    const sourceLanguage = 'EN';
    const targetLanguage = 'JA';
    const provider = 'deepl';
    const hashes = texts.map((value) => this.hash(value, context));
    const cached = await this.cacheRepository.find({
      where: {
        sourceLanguage,
        targetLanguage,
        sourceTextHash: In(hashes),
        provider,
      },
    });
    const cacheMap = new Map(
      cached.map((entry) => [entry.sourceTextHash, entry.translatedText]),
    );
    const missingIndexByHash = new Map<string, number>();
    hashes.forEach((hash, index) => {
      if (!cacheMap.has(hash) && !missingIndexByHash.has(hash)) {
        missingIndexByHash.set(hash, index);
      }
    });
    const missingIndexes = [...missingIndexByHash.values()];

    if (missingIndexes.length) {
      const translated = await this.requestDeepL(
        missingIndexes.map((index) => texts[index]),
        context,
      );

      const newEntries = translated.map((translatedText, offset) => {
        const index = missingIndexes[offset];
        return this.cacheRepository.create({
          sourceLanguage,
          targetLanguage,
          sourceTextHash: hashes[index],
          sourceText: texts[index],
          translatedText,
          provider,
        });
      });

      await this.cacheRepository.upsert(newEntries, {
        conflictPaths: [
          'sourceLanguage',
          'targetLanguage',
          'sourceTextHash',
          'provider',
        ],
      });
      newEntries.forEach((entry) =>
        cacheMap.set(entry.sourceTextHash, entry.translatedText),
      );
    }

    return hashes.map((hash) => cacheMap.get(hash) ?? '');
  }

  private async requestDeepL(texts: string[], context?: string) {
    const apiKey = this.configService.get<string>('DEEPL_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'DeepL translation is not configured.',
      );
    }

    this.enforceRateLimit();

    const baseUrl = (
      this.configService.get<string>('DEEPL_API_BASE_URL') ??
      'https://api-free.deepl.com'
    ).replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        source_lang: 'EN',
        target_lang: 'JA',
        ...(context ? { context } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    }).catch(() => {
      throw new BadGatewayException('Could not reach DeepL.');
    });

    const data = (await response.json().catch(() => ({}))) as DeepLResponse;
    if (!response.ok) {
      throw new BadGatewayException(
        data.message ?? 'DeepL translation failed.',
      );
    }

    const translations = data.translations?.map((item) => item.text ?? '');
    if (!translations || translations.length !== texts.length) {
      throw new BadGatewayException('DeepL returned an invalid response.');
    }

    return translations;
  }

  private hash(text: string, context?: string) {
    return createHash('sha256')
      .update(`${text}\u0000${context ?? ''}`)
      .digest('hex');
  }

  private enforceRateLimit() {
    const now = Date.now();
    const maximum = Number(
      this.configService.get<string>('DEEPL_MAX_REQUESTS_PER_MINUTE') ?? 30,
    );
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < 60_000,
    );

    if (this.requestTimestamps.length >= maximum) {
      throw new ServiceUnavailableException(
        'Translation request limit reached. Please try again shortly.',
      );
    }

    this.requestTimestamps.push(now);
  }
}
