import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('calendar')
  calendar(@Query('month') month?: string) {
    return this.reportsService.getCalendar(month);
  }

  @Get('weekly')
  weekly() {
    return this.reportsService.getWeekly();
  }
}
