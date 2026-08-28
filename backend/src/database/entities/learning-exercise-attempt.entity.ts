import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum LearningExerciseType {
  DICTATION = 'dictation',
  WRITING = 'writing',
}

@Entity()
export class LearningExerciseAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  heritageSiteId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: LearningExerciseType,
    enumName: 'learning_exercise_type',
  })
  type: LearningExerciseType;

  @Column({ type: 'text' })
  sourceSentenceEn: string;

  @Column({ type: 'text' })
  answerText: string;

  @Column({ type: 'smallint' })
  score: number;

  @Column({ type: 'smallint', default: 0 })
  hintsUsed: number;

  @Column({ type: 'smallint', default: 0 })
  playbackCount: number;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  completedAt: Date;
}
