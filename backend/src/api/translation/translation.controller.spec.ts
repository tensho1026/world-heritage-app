import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TranslationController } from './translation.controller';
import { TranslationRateLimitService } from './translation-rate-limit.service';
import { TranslationService } from './translation.service';

describe('TranslationController validation', () => {
  let app: INestApplication;
  const translationService = {
    translateSelection: jest.fn(() => ({ translatedText: '土手' })),
  };
  const rateLimitService = { consume: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TranslationController],
      providers: [
        { provide: TranslationService, useValue: translationService },
        {
          provide: TranslationRateLimitService,
          useValue: rateLimitService,
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  beforeEach(() => jest.clearAllMocks());

  it('rejects oversized text and unexpected fields before calling providers', async () => {
    await request(app.getHttpServer())
      .post('/translations/selection')
      .send({
        expression: 'x'.repeat(101),
        sourceSentenceEn: 'The bank rises beside the river.',
        apiKey: 'must-not-be-accepted',
      })
      .expect(400);

    expect(rateLimitService.consume).not.toHaveBeenCalled();
    expect(translationService.translateSelection).not.toHaveBeenCalled();
  });

  it('accepts a valid contextual translation request', async () => {
    await request(app.getHttpServer())
      .post('/translations/selection')
      .send({
        expression: 'bank',
        sourceSentenceEn: 'The bank rises beside the river.',
      })
      .expect(201);

    expect(rateLimitService.consume).toHaveBeenCalledTimes(1);
    expect(translationService.translateSelection).toHaveBeenCalledWith(
      'bank',
      'The bank rises beside the river.',
    );
  });
});
