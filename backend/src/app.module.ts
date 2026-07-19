import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTypeOrmModuleOptions } from './database/typeorm.options';
import { WorldHeritageSite } from './world-heritage-site.entity';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
