import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTypeOrmModuleOptions } from './database/typeorm.options';
import { WorldHeritageSite } from './database/entities/world-heritage-site.entity';
import { HeritageImportModule } from './api/import/heritage-import/heritage-import.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
