import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { TranslationCacheService } from './translation-cache.service';

type DeepLResponse = {
  translations?: Array<{ text?: string }>;
};

@Injectable()
export class DeepLService {
  constructor(
    private readonly translationCacheService: TranslationCacheService,
    private readonly configService: ConfigService,
  ) {}

  async translateTexts(texts: string[], context?: string): Promise<string[]> {
    return this.translationCacheService.translate({
      texts,
      context,
      provider: 'deepl',
      sourceLanguage: 'EN',
      targetLanguage: 'JA',
      hash: (text, hashContext) => this.hash(text, hashContext),
      request: (missingTexts, requestContext) =>
        this.requestDeepL(missingTexts, requestContext),
    });
  }

  private async requestDeepL(texts: string[], context?: string) {
    const apiKey = this.configService.get<string>('DEEPL_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'DeepL translation is not configured.',
      );
    }

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
      throw new BadGatewayException('DeepL translation failed.');
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
}
