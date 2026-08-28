import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Column } from 'typeorm';

@Entity()
export class HeritageView {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  heritageSiteId: string;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  viewedAt: Date;
}
