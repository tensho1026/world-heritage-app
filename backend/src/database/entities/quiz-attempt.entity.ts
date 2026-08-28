import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type QuizAnswerRecord = {
  questionId: string;
  answer: string;
  correct: boolean;
};

@Entity()
export class QuizAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  heritageSiteId: string;

  @Column({ type: 'smallint' })
  score: number;

  @Column({ type: 'smallint' })
  total: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  answers: QuizAnswerRecord[];

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  completedAt: Date;
}
