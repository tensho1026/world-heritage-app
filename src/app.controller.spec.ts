import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: {
            isInitialized: true,
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('returns app metadata', () => {
    expect(appController.getRoot()).toEqual({
      name: 'world-heritage-app',
      status: 'ok',
    });
  });

  it('returns database health', () => {
    expect(appController.getHealth()).toEqual({
      status: 'ok',
      database: 'connected',
    });
  });
});
