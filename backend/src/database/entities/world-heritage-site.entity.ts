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

@Entity({ name: 'world_heritage_sites' })
@Index('idx_world_heritage_sites_coordinates', ['latitude', 'longitude'])
export class WorldHeritageSite {
  @PrimaryColumn({ type: 'uuid' })
  uuid: string;

  @Index({ unique: true })
  @Column({ name: 'unesco_id', type: 'varchar', length: 32 })
  unescoId: string;

  @Column({ name: 'name_en', type: 'text' })
  nameEn: string;

  @Column({ name: 'name_fr', type: 'text', nullable: true })
  nameFr: string | null;

  @Column({ name: 'name_es', type: 'text', nullable: true })
  nameEs: string | null;

  @Column({ name: 'name_ru', type: 'text', nullable: true })
  nameRu: string | null;

  @Column({ name: 'name_ar', type: 'text', nullable: true })
  nameAr: string | null;

  @Column({ name: 'name_zh', type: 'text', nullable: true })
  nameZh: string | null;

  @Column({ name: 'short_description_en', type: 'text', nullable: true })
  shortDescriptionEn: string | null;

  @Column({ name: 'short_description_fr', type: 'text', nullable: true })
  shortDescriptionFr: string | null;

  @Column({ name: 'short_description_es', type: 'text', nullable: true })
  shortDescriptionEs: string | null;

  @Column({ name: 'short_description_ru', type: 'text', nullable: true })
  shortDescriptionRu: string | null;

  @Column({ name: 'short_description_ar', type: 'text', nullable: true })
  shortDescriptionAr: string | null;

  @Column({ name: 'short_description_zh', type: 'text', nullable: true })
  shortDescriptionZh: string | null;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string | null;

  @Column({ name: 'justification_en', type: 'text', nullable: true })
  justificationEn: string | null;

  @Index()
  @Column({ name: 'date_inscribed', type: 'smallint', nullable: true })
  dateInscribed: number | null;

  @Column({ name: 'secondary_dates', type: 'text', nullable: true })
  secondaryDates: string | null;

  @Column({ name: 'date_end', type: 'smallint', nullable: true })
  dateEnd: number | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  danger: boolean;

  @Column({ name: 'danger_list', type: 'text', nullable: true })
  dangerList: string | null;

  @Column({ name: 'area_hectares', type: 'double precision', nullable: true })
  areaHectares: number | null;

  @Column({
    name: 'cultural_criteria',
    type: 'enum',
    enum: HeritageCriterion,
    enumName: 'heritage_criterion',
    array: true,
    default: '{}',
  })
  culturalCriteria: HeritageCriterion[];

  @Column({
    name: 'natural_criteria',
    type: 'enum',
    enum: HeritageCriterion,
    enumName: 'heritage_criterion',
    array: true,
    default: '{}',
  })
  naturalCriteria: HeritageCriterion[];

  @Column({ name: 'criteria_text', type: 'text', nullable: true })
  criteriaText: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: HeritageCategory,
    enumName: 'heritage_category',
  })
  category: HeritageCategory;

  @Column({ name: 'category_id', type: 'smallint', nullable: true })
  categoryId: number | null;

  @Column({
    name: 'states_names',
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  statesNames: string[];

  @Column({
    name: 'iso_codes',
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  isoCodes: string[];

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @Column({ name: 'region_code', type: 'varchar', length: 16, nullable: true })
  regionCode: string | null;

  @Column({ type: 'boolean', default: false })
  transboundary: boolean;

  @Column({ name: 'latitude', type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ name: 'longitude', type: 'double precision', nullable: true })
  longitude: number | null;

  @Column({ name: 'main_image_url', type: 'text', nullable: true })
  mainImageUrl: string | null;

  @Column({ name: 'main_image_author', type: 'text', nullable: true })
  mainImageAuthor: string | null;

  @Column({ name: 'main_image_copyright', type: 'text', nullable: true })
  mainImageCopyright: string | null;

  @Column({ name: 'main_image_caption_en', type: 'text', nullable: true })
  mainImageCaptionEn: string | null;

  @Column({ name: 'main_image_caption_fr', type: 'text', nullable: true })
  mainImageCaptionFr: string | null;

  @Column({ name: 'main_image_caption_es', type: 'text', nullable: true })
  mainImageCaptionEs: string | null;

  @Column({ name: 'main_image_caption_ru', type: 'text', nullable: true })
  mainImageCaptionRu: string | null;

  @Column({ name: 'main_image_caption_ar', type: 'text', nullable: true })
  mainImageCaptionAr: string | null;

  @Column({ name: 'main_image_caption_zh', type: 'text', nullable: true })
  mainImageCaptionZh: string | null;

  @Column({
    name: 'image_urls',
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  imageUrls: string[];

  @Column({ name: 'main_video_url', type: 'text', nullable: true })
  mainVideoUrl: string | null;

  @Column({ name: 'main_video_author', type: 'text', nullable: true })
  mainVideoAuthor: string | null;

  @Column({ name: 'main_video_caption_en', type: 'text', nullable: true })
  mainVideoCaptionEn: string | null;

  @Column({ name: 'main_video_caption_fr', type: 'text', nullable: true })
  mainVideoCaptionFr: string | null;

  @Column({ name: 'main_video_caption_es', type: 'text', nullable: true })
  mainVideoCaptionEs: string | null;

  @Column({ name: 'main_video_caption_ru', type: 'text', nullable: true })
  mainVideoCaptionRu: string | null;

  @Column({ name: 'main_video_caption_ar', type: 'text', nullable: true })
  mainVideoCaptionAr: string | null;

  @Column({ name: 'main_video_caption_zh', type: 'text', nullable: true })
  mainVideoCaptionZh: string | null;

  @Column({
    name: 'video_urls',
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  videoUrls: string[];

  @Column({ name: 'components', type: 'jsonb', default: () => "'[]'::jsonb" })
  components: HeritageComponent[];

  @Column({ name: 'components_count', type: 'smallint', default: 0 })
  componentsCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
