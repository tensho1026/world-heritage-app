import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TranslationCache } from '../../database/entities/translation-cache.entity';

type TranslateWithCacheOptions = {
  texts: string[];
  context?: string;
  provider: string;
  sourceLanguage: string;
  targetLanguage: string;
  hash: (text: string, context?: string) => string;
  request: (texts: string[], context?: string) => Promise<string[]>;
};

@Injectable()
export class TranslationCacheService {
  constructor(
    @InjectRepository(TranslationCache)
    private readonly cacheRepository: Repository<TranslationCache>,
  ) {}

  async translate({
    texts,
    context,
    provider,
    sourceLanguage,
    targetLanguage,
    hash,
    request,
  }: TranslateWithCacheOptions): Promise<string[]> {
    if (!texts.length) return [];

    const hashes = texts.map((text) => hash(text, context));
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
    hashes.forEach((sourceTextHash, index) => {
      if (
        !cacheMap.has(sourceTextHash) &&
        !missingIndexByHash.has(sourceTextHash)
      ) {
        missingIndexByHash.set(sourceTextHash, index);
      }
    });
    const missingIndexes = [...missingIndexByHash.values()];

    if (missingIndexes.length) {
      const translated = await request(
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

    return hashes.map((sourceTextHash) => cacheMap.get(sourceTextHash) ?? '');
  }
}
