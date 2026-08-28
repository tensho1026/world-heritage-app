import { Module } from '@nestjs/common';
import { HeritageImportService } from './heritage-import.service';
import { HeritageImportController } from './heritage-import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorldHeritageSite } from '../../../database/entities/world-heritage-site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorldHeritageSite])],
  controllers: [HeritageImportController],
  providers: [HeritageImportService],
})
export class HeritageImportModule {}
