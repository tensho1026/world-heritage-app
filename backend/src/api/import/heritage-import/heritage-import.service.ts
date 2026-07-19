import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  HeritageCategory,
  HeritageCriterion,
  WorldHeritageSite,
} from '../../../database/entities/world-heritage-site.entity';
import { Repository } from 'typeorm';

type UnescoRecord = Record<string, unknown> & {
  uuid: string;
  id_no: string;
  name_en: string;
  category: HeritageCategory;
};

type UnescoResponse = {
  total_count: number;
  results: UnescoRecord[];
};

const UNESCO_API_URL =
  'https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records';
const PAGE_SIZE = 100;

@Injectable()
export class HeritageImportService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
  ) {}

  async importHeritages() {
    let offset = 0;
    let importedCount = 0;
    let totalCount: number;

    while (true) {
      const response = await fetch(
        `${UNESCO_API_URL}?limit=${PAGE_SIZE}&offset=${offset}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch UNESCO heritage data at offset ${offset}`,
        );
      }

      const data = (await response.json()) as UnescoResponse;
      totalCount = data.total_count;

      if (data.results.length === 0) break;

      const heritages = data.results.map((record) => this.toEntity(record));

      await this.heritageRepository.upsert(heritages, {
        conflictPaths: ['uuid'],
      });

      importedCount += heritages.length;
      offset += PAGE_SIZE;
    }

    return { importedCount, totalCount };
  }

  private toEntity(record: UnescoRecord) {
    const coordinates = this.asRecord(record.coordinates);

    return {
      uuid: record.uuid,
      unescoId: record.id_no,
      nameEn: record.name_en,
      shortDescriptionEn: this.asNullableString(record.short_description_en),
      descriptionEn: this.asNullableString(record.description_en),
      justificationEn: this.asNullableString(record.justification_en),
      dateInscribed: this.asNullableNumber(record.date_inscribed),
      secondaryDates: this.asNullableString(record.secondary_dates),
      dateEnd: this.asNullableNumber(record.date_end),
      danger: this.asBoolean(record.danger),
      dangerList: this.asNullableString(record.danger_list),
      areaHectares: this.asNullableNumber(record.area_hectares),
      culturalCriteria: this.asCriteria(record.cultural_criteria),
      naturalCriteria: this.asCriteria(record.natural_criteria),
      criteriaText: this.asNullableString(record.criteria_txt),
      category: record.category,
      categoryId: this.asNullableNumber(record.category_id),
      statesNames: this.asStringArray(record.states_names),
      isoCodes: this.asStringArray(record.iso_codes),
      region: this.asNullableString(record.region),
      regionCode: this.asNullableString(record.region_code),
      transboundary: this.asBoolean(record.transboundary),
      latitude: this.asNullableNumber(coordinates?.lat),
      longitude: this.asNullableNumber(coordinates?.lon),
      mainImageUrl: this.asNullableString(record.main_image_url),
      mainImageAuthor: this.asNullableString(record.main_image_author),
      mainImageCopyright: this.asNullableString(record.main_image_copyright),
      mainImageCaptionEn: this.asNullableString(record.main_image_caption_en),
      imageUrls: this.asStringArray(record.images_urls),
      mainVideoUrl: this.asNullableString(record.main_video_url),
      mainVideoAuthor: this.asNullableString(record.main_video_author),
      mainVideoCaptionEn: this.asNullableString(record.main_video_caption_en),
      videoUrls: this.asStringArray(record.videos_urls),
      componentsCount: this.asNullableNumber(record.components_count) ?? 0,
    };
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private asNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private asBoolean(value: unknown): boolean {
    return value === true || value === 'True' || value === 'true';
  }

  private asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  }

  private asCriteria(value: unknown): HeritageCriterion[] {
    const validCriteria = new Set<string>(Object.values(HeritageCriterion));

    return this.asStringArray(value).filter(
      (criterion): criterion is HeritageCriterion =>
        validCriteria.has(criterion),
    );
  }
}
