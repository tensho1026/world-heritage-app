import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum VocabularyReviewRating {
  AGAIN = 'again',
  HARD = 'hard',
  GOOD = 'good',
}

@Entity()
export class VocabularyReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  vocabularyId: number;

  @Column({
    type: 'enum',
    enum: VocabularyReviewRating,
    enumName: 'vocabulary_review_rating',
  })
  rating: VocabularyReviewRating;

  @Column({ type: 'double precision' })
  previousIntervalDays: number;

  @Column({ type: 'double precision' })
  nextIntervalDays: number;

  @Column({ type: 'timestamptz' })
  nextReviewAt: Date;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  reviewedAt: Date;
}
