import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ChallengeMetric {
  UNIQUE_SITES = 'unique_sites',
  NEW_COUNTRIES = 'new_countries',
  FILTERED_READS = 'filtered_reads',
  VOCABULARY_SAVED = 'vocabulary_saved',
  VOCABULARY_REVIEWS = 'vocabulary_reviews',
  QUIZ_ATTEMPTS = 'quiz_attempts',
  DICTATION_ATTEMPTS = 'dictation_attempts',
  WRITING_ATTEMPTS = 'writing_attempts',
}

export type ChallengeFilters = {
  country?: string;
  region?: string;
  category?: string;
  theme?: string;
};

@Entity()
@Index(['month', 'metric'])
export class MonthlyChallenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index()
  @Column({ type: 'char', length: 7 })
  month: string;

  @Column({
    type: 'enum',
    enum: ChallengeMetric,
    enumName: 'challenge_metric',
  })
  metric: ChallengeMetric;

  @Column({ type: 'int' })
  target: number;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  filters: ChallengeFilters;

  @Column({ type: 'text', default: '' })
  note: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
