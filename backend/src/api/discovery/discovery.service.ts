import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ComprehensionLevel,
  HeritageLearningState,
} from '../../database/entities/heritage-learning-state.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import {
  HeritageCategory,
  WorldHeritageSite,
} from '../../database/entities/world-heritage-site.entity';
import { heritageThemes, ThemeDefinition } from './themes';

export type DiscoveryFilters = {
  q?: string;
  country?: string;
  region?: string;
  category?: string;
  year?: string;
  featured?: string;
  readStatus?: string;
  favorite?: string;
  comprehension?: string;
  theme?: string;
};

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    @InjectRepository(HeritageLearningState)
    private readonly learningRepository: Repository<HeritageLearningState>,
    @InjectRepository(HeritageRead)
    private readonly readRepository: Repository<HeritageRead>,
  ) {}

  async search(filters: DiscoveryFilters, mapOnly = false) {
    const query = this.heritageRepository.createQueryBuilder('site');
    const q = filters.q?.trim();
    if (q) {
      query.andWhere(
        `(site.nameEn ILIKE :q OR COALESCE(site.descriptionEn, '') ILIKE :q OR array_to_string(site.statesNames, ', ') ILIKE :q)`,
        { q: `%${q}%` },
      );
    }
    if (filters.country?.trim()) {
      query.andWhere(':country = ANY(site.statesNames)', {
        country: filters.country.trim(),
      });
    }
    if (filters.region?.trim()) {
      query.andWhere('site.region = :region', {
        region: filters.region.trim(),
      });
    }
    if (filters.category) {
      if (
        !Object.values(HeritageCategory).includes(
          filters.category as HeritageCategory,
        )
      ) {
        throw new BadRequestException('Invalid heritage category.');
      }
      query.andWhere('site.category = :category', {
        category: filters.category,
      });
    }
    if (filters.year) {
      const year = Number(filters.year);
      if (!Number.isInteger(year) || year < 1900 || year > 2200) {
        throw new BadRequestException('Invalid inscription year.');
      }
      query.andWhere('site.dateInscribed = :year', { year });
    }
    if (filters.featured === 'true') {
      query.andWhere('site.isFeatured = true');
    }
    if (filters.readStatus === 'read') {
      query.andWhere(
        'EXISTS (SELECT 1 FROM heritage_read reading WHERE reading."heritageSiteId" = site.uuid)',
      );
    } else if (filters.readStatus === 'unread') {
      query.andWhere(
        'NOT EXISTS (SELECT 1 FROM heritage_read reading WHERE reading."heritageSiteId" = site.uuid)',
      );
    }
    if (filters.favorite === 'true') {
      query.andWhere(
        'EXISTS (SELECT 1 FROM heritage_learning_state saved WHERE saved."heritageSiteId" = site.uuid AND saved."isFavorite" = true)',
      );
    }
    if (filters.comprehension) {
      if (
        !Object.values(ComprehensionLevel).includes(
          filters.comprehension as ComprehensionLevel,
        )
      ) {
        throw new BadRequestException('Invalid comprehension level.');
      }
      query.andWhere(
        'EXISTS (SELECT 1 FROM heritage_learning_state understood WHERE understood."heritageSiteId" = site.uuid AND understood."comprehensionLevel" = :comprehension)',
        { comprehension: filters.comprehension },
      );
    }
    if (filters.theme) {
      const theme = heritageThemes.find((item) => item.slug === filters.theme);
      if (!theme) throw new BadRequestException('Invalid theme.');
      this.applyTheme(query, theme);
    }
    if (mapOnly) {
      query
        .andWhere('site.latitude IS NOT NULL')
        .andWhere('site.longitude IS NOT NULL');
    }

    const sites = await query
      .orderBy('site.isFeatured', 'DESC')
      .addOrderBy('site.nameEn', 'ASC')
      .take(mapOnly ? 2_000 : 500)
      .getMany();
    return this.attachLearning(sites);
  }

  async getFilters() {
    const [regions, countryRows, years] = await Promise.all([
      this.heritageRepository
        .createQueryBuilder('site')
        .select('DISTINCT site.region', 'value')
        .where('site.region IS NOT NULL')
        .orderBy('site.region', 'ASC')
        .getRawMany<{ value: string }>(),
      this.heritageRepository.query(
        `SELECT DISTINCT unnest("statesNames") AS value FROM world_heritage_site ORDER BY value`,
      ) as Promise<Array<{ value: string }>>,
      this.heritageRepository
        .createQueryBuilder('site')
        .select('DISTINCT site.dateInscribed', 'value')
        .where('site.dateInscribed IS NOT NULL')
        .orderBy('site.dateInscribed', 'DESC')
        .getRawMany<{ value: number }>(),
    ]);
    return {
      regions: regions.map((row) => row.value),
      countries: countryRows.map((row) => row.value),
      years: years.map((row) => Number(row.value)),
      categories: Object.values(HeritageCategory),
      comprehensionLevels: Object.values(ComprehensionLevel),
    };
  }

  async getThemes() {
    return Promise.all(
      heritageThemes.map(async (theme) => {
        const query = this.heritageRepository.createQueryBuilder('site');
        this.applyTheme(query, theme);
        return { ...theme, count: await query.getCount() };
      }),
    );
  }

  private applyTheme(
    query: ReturnType<Repository<WorldHeritageSite>['createQueryBuilder']>,
    theme: ThemeDefinition,
  ) {
    if (theme.country) {
      query.andWhere(':themeCountry = ANY(site.statesNames)', {
        themeCountry: theme.country,
      });
    }
    const keywordParts = theme.keywords?.map(
      (_, index) =>
        `(site.nameEn ILIKE :themeKeyword${index} OR COALESCE(site.descriptionEn, '') ILIKE :themeKeyword${index})`,
    );
    if (keywordParts?.length) {
      query.andWhere(
        `(${keywordParts.join(' OR ')})`,
        Object.fromEntries(
          theme.keywords!.map((keyword, index) => [
            `themeKeyword${index}`,
            `%${keyword}%`,
          ]),
        ),
      );
    }
    if (theme.category) {
      query.andWhere('site.category = :themeCategory', {
        themeCategory: theme.category,
      });
    }
  }

  private async attachLearning(sites: WorldHeritageSite[]) {
    if (!sites.length) return [];
    const ids = sites.map((site) => site.uuid);
    const [states, readRows] = await Promise.all([
      this.learningRepository.findBy({ heritageSiteId: In(ids) }),
      this.readRepository
        .createQueryBuilder('reading')
        .select('reading.heritageSiteId', 'heritageSiteId')
        .addSelect('COUNT(*)', 'readCount')
        .where('reading.heritageSiteId IN (:...ids)', { ids })
        .groupBy('reading.heritageSiteId')
        .getRawMany<{ heritageSiteId: string; readCount: string }>(),
    ]);
    const stateMap = new Map(
      states.map((state) => [state.heritageSiteId, state]),
    );
    const readMap = new Map(
      readRows.map((row) => [row.heritageSiteId, Number(row.readCount)]),
    );
    return sites.map((site) => ({
      uuid: site.uuid,
      nameEn: site.nameEn,
      shortDescriptionEn: site.shortDescriptionEn,
      statesNames: site.statesNames,
      region: site.region,
      category: site.category,
      dateInscribed: site.dateInscribed,
      latitude: site.latitude,
      longitude: site.longitude,
      isFeatured: site.isFeatured,
      mainImageUrl: site.mainImageUrl ?? site.wikipediaImageUrl,
      comprehensionLevel: stateMap.get(site.uuid)?.comprehensionLevel ?? null,
      isFavorite: stateMap.get(site.uuid)?.isFavorite ?? false,
      isReadLater: stateMap.get(site.uuid)?.isReadLater ?? false,
      readCount: readMap.get(site.uuid) ?? 0,
    }));
  }
}
