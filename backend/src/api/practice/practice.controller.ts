import { Body, Controller, Post } from '@nestjs/common';
import { CreatePracticeAttempt, PracticeService } from './practice.service';

@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('attempts')
  create(@Body() input: CreatePracticeAttempt) {
    return this.practiceService.create(input);
  }
}
