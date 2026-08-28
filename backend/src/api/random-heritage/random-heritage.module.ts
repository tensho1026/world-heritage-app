import { Module } from '@nestjs/common';
import { RandomHeritageService } from './random-heritage.service';
import { RandomHeritageController } from './random-heritage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorldHeritageSite])],
  controllers: [RandomHeritageController],
  providers: [RandomHeritageService],
})
export class RandomHeritageModule {}
