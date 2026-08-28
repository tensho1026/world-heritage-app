import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['heritageSiteId', 'sectionKey', 'startOffset', 'endOffset'], {
  unique: true,
})
export class ArticleHighlight {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  heritageSiteId: string;

  @Column({ type: 'varchar', length: 120 })
  sectionKey: string;

  @Column({ type: 'int' })
  startOffset: number;

  @Column({ type: 'int' })
  endOffset: number;

  @Column({ type: 'text' })
  selectedText: string;

  @Column({ type: 'text', default: '' })
  noteJa: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  difficultyReason: string | null;

  @Column({ type: 'text', default: '' })
  reasonDetail: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
