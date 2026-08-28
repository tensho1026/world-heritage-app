import { Controller, Get, Query } from '@nestjs/common';
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
  filters() {
    return this.discoveryService.getFilters();
  }

  @Get('themes')
  themes() {
    return this.discoveryService.getThemes();
  }
}
