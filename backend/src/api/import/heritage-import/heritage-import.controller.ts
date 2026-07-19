import { Controller, Post } from '@nestjs/common';
import { HeritageImportService } from './heritage-import.service';

@Controller('heritage-import')
export class HeritageImportController {
  constructor(private readonly heritageImportService: HeritageImportService) {}

  @Post()
  async importHeritages() {
    return await this.heritageImportService.importHeritages();
  }
}
