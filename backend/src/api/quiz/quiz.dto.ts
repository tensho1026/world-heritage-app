import { IsObject } from 'class-validator';

export class SubmitQuizAttemptDto {
  @IsObject()
  answers: Record<string, unknown>;
}
