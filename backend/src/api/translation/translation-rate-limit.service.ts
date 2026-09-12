import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { TranslationRateLimit } from '../../database/entities/translation-rate-limit.entity';

@Injectable()
export class TranslationRateLimitService {
  constructor(
    @InjectRepository(TranslationRateLimit)
    private readonly repository: Repository<TranslationRateLimit>,
    private readonly configService: ConfigService,
  ) {}

  async consume(clientAddress: string, operation: string) {
    const maximum = Math.max(
      1,
      Number(
        this.configService.get<string>('TRANSLATION_MAX_REQUESTS_PER_MINUTE') ??
          20,
      ),
    );
    const clientKey = createHash('sha256')
      .update(`${clientAddress}:${operation}`)
      .digest('hex');
    const [row] = (await this.repository.query(
      `WITH cleanup AS (
         DELETE FROM "translation_rate_limit"
         WHERE "windowStart" < now() - interval '1 day'
       )
       INSERT INTO "translation_rate_limit" ("clientKey", "windowStart", "requestCount")
       VALUES ($1, date_trunc('minute', now()), 1)
       ON CONFLICT ("clientKey", "windowStart")
       DO UPDATE SET "requestCount" = "translation_rate_limit"."requestCount" + 1
       RETURNING "requestCount", "windowStart"`,
      [clientKey],
    )) as Array<{ requestCount: number | string; windowStart: Date | string }>;

    if (Number(row.requestCount) > maximum) {
      const retryAfterSeconds = Math.max(1, 60 - new Date().getUTCSeconds());
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            '翻訳の利用上限に達しました。しばらく待って再試行してください。',
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
