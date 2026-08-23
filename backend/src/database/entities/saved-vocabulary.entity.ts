import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SavedVocabulary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  expression: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  normalizedExpression: string;

  @Column({ type: 'text' })
  translationJa: string;

  @Index()
  @Column({ type: 'boolean', default: true })
  isInMemorization: boolean;

  @Index()
  @Column({ type: 'boolean', default: true })
  isUncertain: boolean;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  nextReviewAt: Date;

  @Column({ type: 'double precision', default: 0 })
  reviewIntervalDays: number;

  @Column({ type: 'double precision', default: 2.5 })
  reviewEaseFactor: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  lapseCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastReviewedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
