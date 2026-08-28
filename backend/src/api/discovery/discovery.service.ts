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
      .take(2_000)
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
        const countQuery = this.heritageRepository.createQueryBuilder('site');
        const imageQuery = this.heritageRepository.createQueryBuilder('site');
        this.applyTheme(countQuery, theme);
        this.applyTheme(imageQuery, theme);
        const [count, representative] = await Promise.all([
          countQuery.getCount(),
          imageQuery
            .andWhere(
              '(site.mainImageUrl IS NOT NULL OR site.wikipediaImageUrl IS NOT NULL)',
            )
            .orderBy('site.isFeatured', 'DESC')
            .addOrderBy('site.nameEn', 'ASC')
            .getOne(),
        ]);
        return {
          ...theme,
          count,
          mainImageUrl:
            representative?.mainImageUrl ??
            representative?.wikipediaImageUrl ??
            null,
        };
      }),
    );
  }

  async getRandom(filters: DiscoveryFilters) {
    const sites = await this.search(filters);
    if (!sites.length) return null;
    return sites[Math.floor(Math.random() * sites.length)];
  }

  async getProgress() {
    const [sites, readRows] = await Promise.all([
      this.heritageRepository.find({ order: { nameEn: 'ASC' } }),
      this.readRepository
        .createQueryBuilder('reading')
        .select('DISTINCT reading.heritageSiteId', 'heritageSiteId')
        .getRawMany<{ heritageSiteId: string }>(),
    ]);
    const readIds = new Set(readRows.map((row) => row.heritageSiteId));
    type ProgressBucket = {
      name: string;
      isoCode?: string;
      siteIds: Set<string>;
      readIds: Set<string>;
      sites: Array<{ uuid: string; nameEn: string; read: boolean }>;
    };
    const countries = new Map<string, ProgressBucket>();
    const regions = new Map<string, ProgressBucket>();

    for (const site of sites) {
      const read = readIds.has(site.uuid);
      site.statesNames.forEach((name, index) => {
        const isoCode = site.isoCodes[index]?.toUpperCase();
        const key = isoCode || name;
        const bucket = countries.get(key) ?? {
          name,
          isoCode,
          siteIds: new Set<string>(),
          readIds: new Set<string>(),
          sites: [],
        };
        if (!bucket.siteIds.has(site.uuid)) {
          bucket.siteIds.add(site.uuid);
          bucket.sites.push({ uuid: site.uuid, nameEn: site.nameEn, read });
        }
        if (read) bucket.readIds.add(site.uuid);
        countries.set(key, bucket);
      });
      const regionName = site.region ?? 'Unknown';
      const region = regions.get(regionName) ?? {
        name: regionName,
        siteIds: new Set<string>(),
        readIds: new Set<string>(),
        sites: [],
      };
      if (!region.siteIds.has(site.uuid)) {
        region.siteIds.add(site.uuid);
        region.sites.push({ uuid: site.uuid, nameEn: site.nameEn, read });
      }
      if (read) region.readIds.add(site.uuid);
      regions.set(regionName, region);
    }

    const serialize = (bucket: ProgressBucket) => ({
      name: bucket.name,
      ...(bucket.isoCode ? { isoCode: bucket.isoCode } : {}),
      total: bucket.siteIds.size,
      read: bucket.readIds.size,
      percentage: bucket.siteIds.size
        ? Math.round((bucket.readIds.size / bucket.siteIds.size) * 100)
        : 0,
      sites: bucket.sites,
    });
    return {
      totalSites: sites.length,
      readSites: readIds.size,
      totalCountries: countries.size,
      readCountries: [...countries.values()].filter(
        (country) => country.readIds.size > 0,
      ).length,
      countries: [...countries.values()].map(serialize),
      regions: [...regions.values()].map(serialize),
    };
  }

  async getTimeline(filters: DiscoveryFilters) {
    const summaries = await this.search(filters);
    if (!summaries.length) return [];
    const sites = await this.heritageRepository.findBy({
      uuid: In(summaries.map((site) => site.uuid)),
    });
    const siteMap = new Map(sites.map((site) => [site.uuid, site]));
    return summaries.map((summary) => ({
      ...summary,
      historicalPeriods: this.historicalPeriods(siteMap.get(summary.uuid)!),
    }));
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
    if (theme.region) {
      query.andWhere('site.region = :themeRegion', {
        themeRegion: theme.region,
      });
    }
    if (theme.danger) {
      query.andWhere('site.danger = true');
    }
    if (theme.transboundary) {
      query.andWhere('site.transboundary = true');
    }
  }

  private historicalPeriods(site: WorldHeritageSite) {
    if (site.historicalPeriods?.length) return site.historicalPeriods;
    if (site.historicalPeriodStart != null) {
      return [
        {
          start: site.historicalPeriodStart,
          end: site.historicalPeriodEnd,
          label:
            site.historicalPeriodLabel ??
            this.formatHistoricalYear(site.historicalPeriodStart),
          type: site.historicalPeriodType ?? '成立',
          sourceUrl:
            site.historicalPeriodSourceUrl ??
            `https://whc.unesco.org/en/list/${site.unescoId}`,
          approximate: site.historicalPeriodApproximate,
          verified: site.historicalPeriodVerified,
        },
      ];
    }
    const text = [
      site.shortDescriptionEn,
      site.descriptionEn,
      site.justificationEn,
    ]
      .filter(Boolean)
      .join(' ');
    const century = text.match(
      /\b(\d{1,2})(?:st|nd|rd|th) century(?:\s+(BC|BCE|AD|CE))?/i,
    );
    if (century) {
      const number = Number(century[1]);
      const beforeCommonEra = /BC|BCE/i.test(century[2] ?? '');
      const start = beforeCommonEra ? -number * 100 : (number - 1) * 100;
      return [
        {
          start,
          end: start + 99,
          label: century[0],
          type: '本文に記載された年代',
          sourceUrl: `https://whc.unesco.org/en/list/${site.unescoId}`,
          approximate: true,
          verified: false,
        },
      ];
    }
    const datedEvent = text.match(
      /\b(?:built|founded|established|constructed|created|developed|dates? back to|dating from)[^.!?]{0,45}?\b(\d{3,4})\b/i,
    );
    if (datedEvent) {
      return [
        {
          start: Number(datedEvent[1]),
          end: null,
          label: datedEvent[0],
          type: '本文に記載された年代',
          sourceUrl: `https://whc.unesco.org/en/list/${site.unescoId}`,
          approximate: true,
          verified: false,
        },
      ];
    }
    return [];
  }

  private formatHistoricalYear(year: number) {
    return year < 0 ? `${Math.abs(year)} BCE` : String(year);
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
      isoCodes: site.isoCodes,
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
