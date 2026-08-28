import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ComprehensionLevel {
  DIFFICULT = 'difficult',
  PARTIAL = 'partial',
  UNDERSTOOD = 'understood',
}

@Entity()
export class HeritageLearningState {
  @PrimaryColumn({ type: 'uuid' })
  heritageSiteId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ComprehensionLevel,
    enumName: 'comprehension_level',
    nullable: true,
  })
  comprehensionLevel: ComprehensionLevel | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isFavorite: boolean;

  @Index()
  @Column({ type: 'boolean', default: false })
  isReadLater: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
