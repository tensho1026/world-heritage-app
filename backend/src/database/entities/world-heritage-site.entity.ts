import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum HeritageCategory {
  CULTURAL = 'Cultural',
  NATURAL = 'Natural',
  MIXED = 'Mixed',
}

export enum HeritageCriterion {
  C1 = 'c1',
  C2 = 'c2',
  C3 = 'c3',
  C4 = 'c4',
  C5 = 'c5',
  C6 = 'c6',
  N7 = 'n7',
  N8 = 'n8',
  N9 = 'n9',
  N10 = 'n10',
}

export type HeritageComponent = {
  name: string;
  reference: string;
  latitude: number;
  longitude: number;
};

@Entity()
@Index('idx_world_heritage_sites_coordinates', ['latitude', 'longitude'])
export class WorldHeritageSite {
  @PrimaryColumn({ type: 'uuid' })
  uuid: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  unescoId: string;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  nameFr: string | null;

  @Column({ type: 'text', nullable: true })
  nameEs: string | null;

  @Column({ type: 'text', nullable: true })
  nameRu: string | null;

  @Column({ type: 'text', nullable: true })
  nameAr: string | null;

  @Column({ type: 'text', nullable: true })
  nameZh: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescriptionEn: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescriptionFr: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescriptionEs: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescriptionRu: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescriptionAr: string | null;

  @Column({ type: 'text', nullable: true })
  shortDescriptionZh: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionEn: string | null;

  @Column({ type: 'text', nullable: true })
  justificationEn: string | null;

  @Index()
  @Column({ type: 'smallint', nullable: true })
  dateInscribed: number | null;

  @Column({ type: 'text', nullable: true })
  secondaryDates: string | null;

  @Column({ type: 'smallint', nullable: true })
  dateEnd: number | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  danger: boolean;

  @Column({ type: 'text', nullable: true })
  dangerList: string | null;

  @Column({ type: 'double precision', nullable: true })
  areaHectares: number | null;

  @Column({
    type: 'enum',
    enum: HeritageCriterion,
    enumName: 'heritage_criterion',
    array: true,
    default: '{}',
  })
  culturalCriteria: HeritageCriterion[];

  @Column({
    type: 'enum',
    enum: HeritageCriterion,
    enumName: 'heritage_criterion',
    array: true,
    default: '{}',
  })
  naturalCriteria: HeritageCriterion[];

  @Column({ type: 'text', nullable: true })
  criteriaText: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: HeritageCategory,
    enumName: 'heritage_category',
  })
  category: HeritageCategory;

  @Column({ type: 'smallint', nullable: true })
  categoryId: number | null;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  statesNames: string[];

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  isoCodes: string[];

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  regionCode: string | null;

  @Column({ type: 'boolean', default: false })
  transboundary: boolean;

  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @Column({ type: 'text', nullable: true })
  mainImageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageAuthor: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageCopyright: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageCaptionEn: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageCaptionFr: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageCaptionEs: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageCaptionRu: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageCaptionAr: string | null;

  @Column({ type: 'text', nullable: true })
  mainImageCaptionZh: string | null;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  imageUrls: string[];

  @Column({ type: 'text', nullable: true })
  mainVideoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  mainVideoAuthor: string | null;

  @Column({ type: 'text', nullable: true })
  mainVideoCaptionEn: string | null;

  @Column({ type: 'text', nullable: true })
  mainVideoCaptionFr: string | null;

  @Column({ type: 'text', nullable: true })
  mainVideoCaptionEs: string | null;

  @Column({ type: 'text', nullable: true })
  mainVideoCaptionRu: string | null;

  @Column({ type: 'text', nullable: true })
  mainVideoCaptionAr: string | null;

  @Column({ type: 'text', nullable: true })
  mainVideoCaptionZh: string | null;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  videoUrls: string[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  components: HeritageComponent[];

  @Column({ type: 'smallint', default: 0 })
  componentsCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
