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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
