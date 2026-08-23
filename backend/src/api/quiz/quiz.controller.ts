import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('heritage/:heritageSiteId/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  getQuiz(@Param('heritageSiteId') heritageSiteId: string) {
    return this.quizService.getQuiz(heritageSiteId);
  }

  @Get('history')
  getHistory(@Param('heritageSiteId') heritageSiteId: string) {
    return this.quizService.getHistory(heritageSiteId);
  }

  @Post('attempts')
  submit(
    @Param('heritageSiteId') heritageSiteId: string,
    @Body('answers') answers: unknown,
  ) {
    return this.quizService.submit(heritageSiteId, answers);
  }
}
