import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class HeritageRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  heritageSiteId: string;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  readAt: Date;
}
