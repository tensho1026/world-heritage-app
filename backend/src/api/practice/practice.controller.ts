import { Body, Controller, Post } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { CreatePracticeAttemptDto } from './practice.dto';

@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('attempts')
  create(@Body() input: CreatePracticeAttemptDto) {
    return this.practiceService.create(input);
  }
}
