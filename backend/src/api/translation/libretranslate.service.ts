import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { TranslationCacheService } from './translation-cache.service';

type LibreTranslateResponse = {
  translatedText?: string | string[];
  error?: string;
};

@Injectable()
export class LibreTranslateService {
  constructor(
    private readonly translationCacheService: TranslationCacheService,
    private readonly configService: ConfigService,
  ) {}

  async translateTexts(texts: string[], context?: string): Promise<string[]> {
    return this.translationCacheService.translate({
      texts,
      context,
      provider: 'libretranslate',
      sourceLanguage: 'EN',
      targetLanguage: 'JA',
      hash: (text, hashContext) => this.hash(text, hashContext),
      request: (missingTexts, requestContext) =>
        requestContext
          ? this.requestWithContext(missingTexts, requestContext)
          : this.requestLibreTranslate(missingTexts),
    });
  }

  private async requestLibreTranslate(texts: string[]) {
    const baseUrl = (
      this.configService.get<string>('LIBRETRANSLATE_URL') ??
      'http://127.0.0.1:5001'
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
      throw new BadGatewayException('LibreTranslate translation failed.');
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

  private async requestWithContext(texts: string[], context: string) {
    const separator = '\n\n--- CONTEXT ---\n';
    const translated = await this.requestLibreTranslate(
      texts.map((text) => `${text}${separator}${context}`),
    );
    return translated.map((value) => {
      const contextIndex = value.search(/\n\s*---[^\n]*---\s*\n/i);
      return (
        contextIndex >= 0 ? value.slice(0, contextIndex) : value.split('\n')[0]
      )
        .trim()
        .replace(/^[「『“"]/, '')
        .replace(/[」』”"]$/, '');
    });
  }

  private hash(text: string, context?: string) {
    return createHash('sha256')
      .update(context ? `${text}\u0000${context}` : text)
      .digest('hex');
  }
}
