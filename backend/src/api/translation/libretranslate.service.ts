import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { TranslationCache } from '../../database/entities/translation-cache.entity';

type LibreTranslateResponse = {
  translatedText?: string | string[];
  error?: string;
};

@Injectable()
export class LibreTranslateService {
  constructor(
    @InjectRepository(TranslationCache)
    private readonly cacheRepository: Repository<TranslationCache>,
    private readonly configService: ConfigService,
  ) {}

  async translateTexts(texts: string[]): Promise<string[]> {
    if (!texts.length) return [];

    const sourceLanguage = 'EN';
    const targetLanguage = 'JA';
    const provider = 'libretranslate';
    const hashes = texts.map((text) => this.hash(text));
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
      const sourceTexts = missingIndexes.map((index) => texts[index]);
      const translations = await this.requestLibreTranslate(sourceTexts);
      const newEntries = translations.map((translatedText, offset) => {
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

  private async requestLibreTranslate(texts: string[]) {
    const baseUrl = (
      this.configService.get<string>('LIBRETRANSLATE_URL') ??
      'http://127.0.0.1:5000'
    ).replace(/\/$/, '');

    const apiKey = this.configService.get<string>('LIBRETRANSLATE_API_KEY');
    const response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source: 'en',
        target: 'ja',
        format: 'text',
        ...(apiKey ? { api_key: apiKey } : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    }).catch(() => {
      throw new BadGatewayException('Could not reach LibreTranslate.');
    });
    const data = (await response
      .json()
      .catch(() => ({}))) as LibreTranslateResponse;
    if (!response.ok) {
      throw new BadGatewayException(
        data.error ?? 'LibreTranslate translation failed.',
      );
    }

    const translations = Array.isArray(data.translatedText)
      ? data.translatedText
      : [data.translatedText ?? ''];
    if (
      translations.length !== texts.length ||
      translations.some((translation) => !translation)
    ) {
      throw new BadGatewayException(
        'LibreTranslate returned an invalid response.',
      );
    }
    return translations;
  }

  private hash(text: string) {
    return createHash('sha256').update(text).digest('hex');
  }
}
