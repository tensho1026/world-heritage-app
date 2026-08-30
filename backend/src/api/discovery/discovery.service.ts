import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { WikipediaMediaService } from '../heritage/wikipedia-media.service';

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
  page?: string;
  pageSize?: string;
};

const DISCOVERY_PAGE_SIZE = 24;
const MAX_DISCOVERY_PAGE_SIZE = 100;
const THEME_CACHE_TTL_MS = 5 * 60_000;

type ThemeSummary = ThemeDefinition & {
  count: number;
  representativeUuid: string | null;
  mainImageUrl: string | null;
};

type ThemeCountRow = { slug: string; count: string };
type ThemeRepresentativeRow = {
  slug: string;
  uuid: string;
  nameEn: string;
  mainImageUrl: string | null;
  wikipediaImageUrl: string | null;
  wikipediaPageUrl: string | null;
};

@Injectable()
export class DiscoveryService {
  private themeCache: { expiresAt: number; value: ThemeSummary[] } | null =
    null;
  private themeLoad: Promise<ThemeSummary[]> | null = null;

  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    @InjectRepository(HeritageLearningState)
    private readonly learningRepository: Repository<HeritageLearningState>,
    @InjectRepository(HeritageRead)
    private readonly readRepository: Repository<HeritageRead>,
    private readonly wikipediaMediaService: WikipediaMediaService,
  ) {}

  async searchPage(filters: DiscoveryFilters) {
    const page = this.positiveInteger(filters.page, 1);
    const pageSize = Math.min(
      this.positiveInteger(filters.pageSize, DISCOVERY_PAGE_SIZE),
      MAX_DISCOVERY_PAGE_SIZE,
    );
    const query = this.createSearchQuery(filters);
    query.select([
      'site.uuid',
      'site.nameEn',
      'site.statesNames',
      'site.category',
      'site.dateInscribed',
      'site.isFeatured',
      'site.mainImageUrl',
      'site.wikipediaImageUrl',
      'site.wikipediaPageUrl',
    ]);
    const [sites, total] = await query
      .orderBy('site.isFeatured', 'DESC')
      .addOrderBy('site.nameEn', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: await this.attachLearning(sites, { imageWidth: 480 }),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async searchMap(filters: DiscoveryFilters) {
    const query = this.createSearchQuery(filters, true);
    query.select([
      'site.uuid',
      'site.latitude',
      'site.longitude',
      'site.isFeatured',
    ]);
    const sites = await query
      .orderBy('site.isFeatured', 'DESC')
      .addOrderBy('site.nameEn', 'ASC')
      .take(2_000)
      .getMany();
    return this.attachLearning(sites, { compact: true });
  }

  async search(filters: DiscoveryFilters, mapOnly = false) {
    const query = this.createSearchQuery(filters, mapOnly);
    const sites = await query
      .orderBy('site.isFeatured', 'DESC')
      .addOrderBy('site.nameEn', 'ASC')
      .take(2_000)
      .getMany();
    return this.attachLearning(sites, { imageWidth: 480 });
  }

  private createSearchQuery(filters: DiscoveryFilters, mapOnly = false) {
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

    return query;
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
    if (this.themeCache && this.themeCache.expiresAt > Date.now()) {
      return this.themeCache.value;
    }
    if (this.themeLoad) return this.themeLoad;

    this.themeLoad = this.loadThemes();
    try {
      const value = await this.themeLoad;
      this.themeCache = {
        expiresAt: Date.now() + THEME_CACHE_TTL_MS,
        value,
      };
      return value;
    } finally {
      this.themeLoad = null;
    }
  }

  private async loadThemes(): Promise<ThemeSummary[]> {
    // Keep all theme counts and representatives in two database round trips.
    // The previous implementation issued two queries per theme, which made a
    // cold /discovery/themes request wait on 34 independent queries.
    const countParameters: string[] = [];
    const countSql = heritageThemes
      .map((theme) => {
        const slug = this.addThemeParameter(countParameters, theme.slug);
        const condition = this.themeSqlCondition(theme, (value) =>
          this.addThemeParameter(countParameters, value),
        );
        return `SELECT ${slug}::text AS slug, COUNT(*)::text AS count FROM world_heritage_site site WHERE ${condition}`;
      })
      .join(' UNION ALL ');
    const representativeParameters: string[] = [];
    const representativeSql = heritageThemes
      .map((theme) => {
        const slug = this.addThemeParameter(
          representativeParameters,
          theme.slug,
        );
        const condition = this.themeSqlCondition(theme, (value) =>
          this.addThemeParameter(representativeParameters, value),
        );
        return `(SELECT ${slug}::text AS slug, site."uuid"::text AS uuid, site."nameEn" AS "nameEn", site."mainImageUrl" AS "mainImageUrl", site."wikipediaImageUrl" AS "wikipediaImageUrl", site."wikipediaPageUrl" AS "wikipediaPageUrl" FROM world_heritage_site site WHERE ${condition} ORDER BY site."isFeatured" DESC, site."nameEn" ASC LIMIT 1)`;
      })
      .join(' UNION ALL ');

    const [countRows, representativeRows] = await Promise.all([
      this.heritageRepository.query(countSql, countParameters) as Promise<
        ThemeCountRow[]
      >,
      this.heritageRepository.query(
        representativeSql,
        representativeParameters,
      ) as Promise<ThemeRepresentativeRow[]>,
    ]);
    const counts = new Map(countRows.map((row) => [row.slug, Number(row.count)]));
    const representatives = new Map(
      representativeRows.map((row) => [row.slug, row]),
    );

    return heritageThemes.map((theme) => {
      const representative = representatives.get(theme.slug);
      const representativeSite = representative
        ? ({
            uuid: representative.uuid,
            nameEn: representative.nameEn,
            mainImageUrl: representative.mainImageUrl,
            wikipediaImageUrl: representative.wikipediaImageUrl,
            wikipediaPageUrl: representative.wikipediaPageUrl,
          } as WorldHeritageSite)
        : null;
      return {
        ...theme,
        count: counts.get(theme.slug) ?? 0,
        representativeUuid: representative?.uuid ?? null,
        mainImageUrl: representativeSite
          ? this.wikipediaMediaService.getDisplayImageUrl(
              representativeSite,
              320,
            )
          : null,
      };
    });
  }

  async getRandom(filters: DiscoveryFilters) {
    const site = await this.createSearchQuery(filters)
      .select([
        'site.uuid',
        'site.nameEn',
        'site.statesNames',
        'site.category',
        'site.dateInscribed',
        'site.isFeatured',
      ])
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
    if (!site) return null;
    return (await this.attachLearning([site], { imageWidth: 480 }))[0];
  }

  async getMapSite(id: string) {
    const site = await this.heritageRepository.findOne({
      select: {
        uuid: true,
        nameEn: true,
        statesNames: true,
        category: true,
        dateInscribed: true,
        isFeatured: true,
        latitude: true,
        longitude: true,
      },
      where: { uuid: id },
    });
    if (!site) throw new NotFoundException('World Heritage site was not found.');
    const [result] = await this.attachLearning([site], { includeImage: false });
    return result;
  }

  async getProgress() {
    const [sites, readRows] = await Promise.all([
      this.heritageRepository.find({
        select: {
          uuid: true,
          nameEn: true,
          statesNames: true,
          isoCodes: true,
          region: true,
        },
        order: { nameEn: 'ASC' },
      }),
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
        };
        if (!bucket.siteIds.has(site.uuid)) {
          bucket.siteIds.add(site.uuid);
        }
        if (read) bucket.readIds.add(site.uuid);
        countries.set(key, bucket);
      });
      const regionName = site.region ?? 'Unknown';
      const region = regions.get(regionName) ?? {
        name: regionName,
        siteIds: new Set<string>(),
        readIds: new Set<string>(),
      };
      if (!region.siteIds.has(site.uuid)) {
        region.siteIds.add(site.uuid);
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
      sites: [],
    });
    return {
      totalSites: sites.length,
      readSites: readIds.size,
      totalCountries: countries.size,
      readCountries: [...countries.values()].filter(
        (country) => country.readIds.size > 0,
      ).length,
      countries: [...countries.values()].map((country) =>
        serialize(country),
      ),
      regions: [...regions.values()].map((region) => serialize(region)),
    };
  }

  async getCountryProgress(isoCode: string) {
    const normalizedIsoCode = isoCode.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedIsoCode)) {
      throw new BadRequestException('Invalid country code.');
    }

    const sites = await this.heritageRepository
      .createQueryBuilder('site')
      .where(':isoCode = ANY(site.isoCodes)', { isoCode: normalizedIsoCode })
      .select([
        'site.uuid',
        'site.nameEn',
        'site.statesNames',
        'site.isoCodes',
      ])
      .orderBy('site.nameEn', 'ASC')
      .getMany();
    if (!sites.length) {
      throw new NotFoundException('Country progress was not found.');
    }

    const ids = sites.map((site) => site.uuid);
    const readRows = await this.readRepository
      .createQueryBuilder('reading')
      .select('DISTINCT reading.heritageSiteId', 'heritageSiteId')
      .where('reading.heritageSiteId IN (:...ids)', { ids })
      .getRawMany<{ heritageSiteId: string }>();
    const readIds = new Set(readRows.map((row) => row.heritageSiteId));
    const countrySites = sites.flatMap((site) => {
      const index = site.isoCodes.findIndex(
        (value) => value.toUpperCase() === normalizedIsoCode,
      );
      return index >= 0
        ? [
            {
              uuid: site.uuid,
              nameEn: site.nameEn,
              read: readIds.has(site.uuid),
            },
          ]
        : [];
    });
    const read = countrySites.filter((site) => site.read).length;
    const matchingSite = sites.find((site) =>
      site.isoCodes.some((value) => value.toUpperCase() === normalizedIsoCode),
    );
    const matchingIndex = matchingSite?.isoCodes.findIndex(
      (value) => value.toUpperCase() === normalizedIsoCode,
    );
    const name =
      matchingSite && matchingIndex !== undefined && matchingIndex >= 0
        ? matchingSite.statesNames[matchingIndex]
        : normalizedIsoCode;

    return {
      name,
      isoCode: normalizedIsoCode,
      total: countrySites.length,
      read,
      percentage: countrySites.length
        ? Math.round((read / countrySites.length) * 100)
        : 0,
      sites: countrySites,
    };
  }

  async getTimeline(filters: DiscoveryFilters) {
    const sites = await this.createSearchQuery(filters)
      .select([
        'site.uuid',
        'site.unescoId',
        'site.nameEn',
        'site.shortDescriptionEn',
        'site.statesNames',
        'site.category',
        'site.dateInscribed',
        'site.historicalPeriodStart',
        'site.historicalPeriodEnd',
        'site.historicalPeriodLabel',
        'site.historicalPeriodType',
        'site.historicalPeriodSourceUrl',
        'site.historicalPeriodApproximate',
        'site.historicalPeriodVerified',
        'site.historicalPeriods',
      ])
      .orderBy('site.isFeatured', 'DESC')
      .addOrderBy('site.nameEn', 'ASC')
      .take(2_000)
      .getMany();
    const sitesNeedingText = sites.filter(
      (site) =>
        !site.historicalPeriods?.length && site.historicalPeriodStart == null,
    );
    const textById = new Map<string, Partial<WorldHeritageSite>>();
    if (sitesNeedingText.length) {
      const contextSites = await this.heritageRepository.find({
        select: {
          uuid: true,
          shortDescriptionEn: true,
          descriptionEn: true,
          justificationEn: true,
        },
        where: { uuid: In(sitesNeedingText.map((site) => site.uuid)) },
      });
      for (const contextSite of contextSites) {
        textById.set(contextSite.uuid, contextSite);
      }
    }
    return sites.map((site) => ({
      uuid: site.uuid,
      nameEn: site.nameEn,
      shortDescriptionEn: site.shortDescriptionEn?.slice(0, 240) ?? null,
      statesNames: site.statesNames,
      category: site.category,
      dateInscribed: site.dateInscribed,
      historicalPeriods: this.historicalPeriods({
        ...site,
        ...(textById.get(site.uuid) ?? {}),
      }),
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

  private addThemeParameter(parameters: string[], value: string) {
    parameters.push(value);
    return `$${parameters.length}`;
  }

  private themeSqlCondition(
    theme: ThemeDefinition,
    addParameter: (value: string) => string,
  ) {
    const conditions: string[] = [];
    if (theme.country) {
      conditions.push(
        `${addParameter(theme.country)} = ANY(site."statesNames")`,
      );
    }
    if (theme.keywords?.length) {
      conditions.push(
        `(${theme.keywords
          .map((keyword) => {
            const pattern = addParameter(`%${keyword}%`);
            return `(site."nameEn" ILIKE ${pattern} OR COALESCE(site."descriptionEn", '') ILIKE ${pattern})`;
          })
          .join(' OR ')})`,
      );
    }
    if (theme.category) {
      conditions.push(`site."category" = ${addParameter(theme.category)}`);
    }
    if (theme.region) {
      conditions.push(`site."region" = ${addParameter(theme.region)}`);
    }
    if (theme.danger) conditions.push('site."danger" = true');
    if (theme.transboundary) conditions.push('site."transboundary" = true');
    return conditions.length ? conditions.join(' AND ') : 'TRUE';
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
      const start = beforeCommonEra ? -number * 100 : (number - 1) * 100 + 1;
      return [
        {
          start,
          end: beforeCommonEra ? start + 99 : number * 100,
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

  private positiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private async attachLearning(
    sites: WorldHeritageSite[],
    options: {
      compact?: boolean;
      imageWidth?: number;
      includeImage?: boolean;
    } = {},
  ) {
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
    if (options.compact) {
      return sites.map((site) => ({
        uuid: site.uuid,
        latitude: site.latitude,
        longitude: site.longitude,
        isFeatured: site.isFeatured,
        readCount: readMap.get(site.uuid) ?? 0,
      }));
    }

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
      mainImageUrl:
        options.includeImage === false
          ? null
          : this.wikipediaMediaService.getDisplayImageUrl(
              site,
              options.imageWidth ?? 480,
            ),
      comprehensionLevel: stateMap.get(site.uuid)?.comprehensionLevel ?? null,
      isFavorite: stateMap.get(site.uuid)?.isFavorite ?? false,
      isReadLater: stateMap.get(site.uuid)?.isReadLater ?? false,
      readCount: readMap.get(site.uuid) ?? 0,
    }));
  }
}
