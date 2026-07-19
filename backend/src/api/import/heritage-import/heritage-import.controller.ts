import { Controller, Get, } from '@nestjs/common';
import { HeritageImportService } from './heritage-import.service';

@Controller('heritage-import')
export class HeritageImportController {
  constructor(private readonly heritageImportService: HeritageImportService) {}

  @Get()
  async importHeritages ()  {
    return await this.heritageImportService.importHeritages()
  }
}
