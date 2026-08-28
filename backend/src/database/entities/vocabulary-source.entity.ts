import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['vocabularyId', 'heritageSiteId', 'sourceSentenceEn'], { unique: true })
export class VocabularySource {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  vocabularyId: number;

  @Index()
  @Column({ type: 'uuid' })
  heritageSiteId: string;

  @Column({ type: 'text' })
  sourceSentenceEn: string;

  @Column({ type: 'varchar', length: 40 })
  sectionType: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
