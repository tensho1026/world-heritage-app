import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTypeOrmModuleOptions } from './database/typeorm.options';
import { WorldHeritageSite } from './database/entities/world-heritage-site.entity';
import { HeritageImportModule } from './api/import/heritage-import/heritage-import.module';
import { RandomHeritageModule } from './api/random-heritage/random-heritage.module';
import { HeritageModule } from './api/heritage/heritage.module';
import { TranslationModule } from './api/translation/translation.module';
import { VocabularyModule } from './api/vocabulary/vocabulary.module';
import { HighlightsModule } from './api/highlights/highlights.module';
import { DiscoveryModule } from './api/discovery/discovery.module';
import { QuizModule } from './api/quiz/quiz.module';
import { ReportsModule } from './api/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createTypeOrmModuleOptions(
          configService.getOrThrow<string>('DATABASE_URL'),
          configService.get('TYPEORM_SYNCHRONIZE') === 'true',
        ),
    }),
    TypeOrmModule.forFeature([WorldHeritageSite]),
    HeritageImportModule,
    RandomHeritageModule,
    HeritageModule,
    TranslationModule,
    VocabularyModule,
    HighlightsModule,
    DiscoveryModule,
    QuizModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
