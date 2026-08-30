import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { DiscoveryFilters, DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('sites')
  search(@Query() filters: DiscoveryFilters) {
    return this.discoveryService.searchPage(filters);
  }

  @Get('map')
  map(@Query() filters: DiscoveryFilters) {
    return this.discoveryService.searchMap(filters);
  }

  @Get('map/:id')
  mapSite(@Param('id') id: string) {
    return this.discoveryService.getMapSite(id);
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

  @Get('progress/country/:isoCode')
  countryProgress(@Param('isoCode') isoCode: string) {
    return this.discoveryService.getCountryProgress(isoCode);
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
