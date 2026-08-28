import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('heritage/:heritageSiteId/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async getQuiz(@Param('heritageSiteId') heritageSiteId: string) {
    const quiz = await this.quizService.getQuiz(heritageSiteId);
    return {
      ...quiz,
      questions: quiz.questions.map(({ correctAnswer, ...question }) => {
        // The service needs the answer for scoring, but a quiz must not reveal it
        // to the browser before the learner submits an attempt.
        void correctAnswer;
        return question;
      }),
    };
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
