import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { WikipediaMediaService } from '../heritage/wikipedia-media.service';
import { themeFilters } from './theme-filter';
import { heritageThemes, ThemeDefinition } from './themes';

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
export class DiscoveryThemeService {
  private cache: { expiresAt: number; value: ThemeSummary[] } | null = null;
  private load: Promise<ThemeSummary[]> | null = null;

  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    private readonly wikipediaMediaService: WikipediaMediaService,
  ) {}

  async getThemes() {
    if (this.cache && this.cache.expiresAt > Date.now())
      return this.cache.value;
    if (this.load) return this.load;

    this.load = this.loadThemes();
    try {
      const value = await this.load;
      this.cache = { expiresAt: Date.now() + THEME_CACHE_TTL_MS, value };
      return value;
    } finally {
      this.load = null;
    }
  }

  private async loadThemes(): Promise<ThemeSummary[]> {
    const countParameters: string[] = [];
    const countSql = heritageThemes
      .map((theme) => {
        const slug = this.addParameter(countParameters, theme.slug);
        const condition = this.sqlCondition(theme, (value) =>
          this.addParameter(countParameters, value),
        );
        return `SELECT ${slug}::text AS slug, COUNT(*)::text AS count FROM world_heritage_site site WHERE ${condition}`;
      })
      .join(' UNION ALL ');
    const representativeParameters: string[] = [];
    const representativeSql = heritageThemes
      .map((theme) => {
        const slug = this.addParameter(representativeParameters, theme.slug);
        const condition = this.sqlCondition(theme, (value) =>
          this.addParameter(representativeParameters, value),
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
    const counts = new Map(
      countRows.map((row) => [row.slug, Number(row.count)]),
    );
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

  private addParameter(parameters: string[], value: string) {
    parameters.push(value);
    return `$${parameters.length}`;
  }

  private sqlCondition(
    theme: ThemeDefinition,
    addParameter: (value: string) => string,
  ) {
    const conditions = themeFilters(theme).map((filter) => {
      switch (filter.kind) {
        case 'country':
          return `${addParameter(filter.value)} = ANY(site."statesNames")`;
        case 'keywords':
          return `(${filter.values
            .map((keyword) => {
              const pattern = addParameter(`%${keyword}%`);
              return `(site."nameEn" ILIKE ${pattern} OR COALESCE(site."descriptionEn", '') ILIKE ${pattern})`;
            })
            .join(' OR ')})`;
        case 'category':
          return `site."category" = ${addParameter(filter.value)}`;
        case 'region':
          return `site."region" = ${addParameter(filter.value)}`;
        case 'danger':
          return 'site."danger" = true';
        case 'transboundary':
          return 'site."transboundary" = true';
      }
    });
    return conditions.length ? conditions.join(' AND ') : 'TRUE';
  }
}
