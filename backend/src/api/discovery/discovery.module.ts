import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeritageLearningState } from '../../database/entities/heritage-learning-state.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorldHeritageSite,
      HeritageLearningState,
      HeritageRead,
    ]),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
