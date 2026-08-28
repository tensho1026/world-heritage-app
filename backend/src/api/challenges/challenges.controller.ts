import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ChallengeInput, ChallengesService } from './challenges.service';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  list(@Query('month') month?: string) {
    return this.challengesService.list(month);
  }

  @Post()
  create(@Body() input: ChallengeInput) {
    return this.challengesService.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: ChallengeInput) {
    return this.challengesService.update(Number(id), input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.challengesService.remove(Number(id));
  }
}
