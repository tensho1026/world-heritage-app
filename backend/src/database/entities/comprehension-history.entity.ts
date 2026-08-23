import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComprehensionLevel } from './heritage-learning-state.entity';

@Entity()
export class ComprehensionHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  heritageSiteId: string;

  @Column({
    type: 'enum',
    enum: ComprehensionLevel,
    enumName: 'comprehension_level',
    nullable: true,
  })
  previousLevel: ComprehensionLevel | null;

  @Column({
    type: 'enum',
    enum: ComprehensionLevel,
    enumName: 'comprehension_level',
    nullable: true,
  })
  nextLevel: ComprehensionLevel | null;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  changedAt: Date;
}
