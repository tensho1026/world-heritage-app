import { Controller, Get, Header, Query } from '@nestjs/common';
import { DiscoveryFilters, DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('sites')
  search(@Query() filters: DiscoveryFilters) {
    return this.discoveryService.search(filters);
  }

  @Get('map')
  map(@Query() filters: DiscoveryFilters) {
    return this.discoveryService.search(filters, true);
  }

  @Get('filters')
  @Header('Cache-Control', 'private, max-age=300')
  filters() {
    return this.discoveryService.getFilters();
  }

  @Get('random')
  random(@Query() filters: DiscoveryFilters) {
    return this.discoveryService.getRandom(filters);
  }

  @Get('progress')
  progress() {
    return this.discoveryService.getProgress();
  }

  @Get('timeline')
  timeline(@Query() filters: DiscoveryFilters) {
    return this.discoveryService.getTimeline(filters);
  }

  @Get('themes')
  @Header('Cache-Control', 'private, max-age=300')
  themes() {
    return this.discoveryService.getThemes();
  }
}
