import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class TranslationRateLimit {
  @PrimaryColumn({ type: 'char', length: 64 })
  clientKey: string;

  @PrimaryColumn({ type: 'timestamptz' })
  windowStart: Date;

  @Column({ type: 'integer', default: 0 })
  requestCount: number;
}
