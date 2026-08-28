import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['sourceLanguage', 'targetLanguage', 'sourceTextHash', 'provider'], {
  unique: true,
})
export class TranslationCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 8 })
  sourceLanguage: string;

  @Column({ type: 'varchar', length: 8 })
  targetLanguage: string;

  @Column({ type: 'char', length: 64 })
  sourceTextHash: string;

  @Column({ type: 'text' })
  sourceText: string;

  @Column({ type: 'text' })
  translatedText: string;

  @Column({ type: 'varchar', length: 20, default: 'deepl' })
  provider: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
