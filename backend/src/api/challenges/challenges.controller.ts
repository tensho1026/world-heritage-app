import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import {
  ChallengeListQueryDto,
  CreateChallengeDto,
  UpdateChallengeDto,
} from './challenges.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  list(@Query() query: ChallengeListQueryDto) {
    return this.challengesService.list(query.month);
  }

  @Post()
  create(@Body() input: CreateChallengeDto) {
    return this.challengesService.create(input);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateChallengeDto,
  ) {
    return this.challengesService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.challengesService.remove(id);
  }
}
