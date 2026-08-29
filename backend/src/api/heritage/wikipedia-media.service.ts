import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

type WikipediaPage = {
  title?: string;
  index?: number;
  fullurl?: string;
  pageimage?: string;
  original?: { source?: string };
  thumbnail?: { source?: string };
  imageinfo?: Array<{
    extmetadata?: {
      Artist?: { value?: string };
      Credit?: { value?: string };
      LicenseShortName?: { value?: string };
    };
  }>;
};

type WikipediaResponse = {
  query?: { pages?: Record<string, WikipediaPage> };
};

const FAILED_FETCH_RETRY_MS = 24 * 60 * 60 * 1_000;
const GENERIC_WIKIPEDIA_TITLES = new Set([
  'unesco',
  'world heritage',
  'world heritage committee',
  'world heritage site',
]);
const TITLE_STOP_WORDS = new Set([
  'a',
  'an',
  'ancient',
  'and',
  'archaeological',
  'area',
  'at',
  'centre',
  'center',
  'city',
  'cultural',
  'for',
  'historic',
  'in',
  'landscape',
  'national',
  'of',
  'on',
  'park',
  'remains',
  'reserve',
  'site',
  'sites',
  'system',
  'the',
  'unesco',
  'world',
  'heritage',
]);

@Injectable()
export class WikipediaMediaService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    private readonly configService: ConfigService,
  ) {}

  async fillMissingImage(site: WorldHeritageSite): Promise<WorldHeritageSite> {
    if (
      this.hasRelevantWikipediaImage(site) ||
      this.isUsableMainImageUrl(site.mainImageUrl) ||
      (!site.wikipediaImageUrl &&
        this.wasRecentlyFetched(site.wikipediaImageFetchedAt))
    ) {
      return site;
    }

    const apiUrl =
      this.configService.get<string>('WIKIPEDIA_API_URL') ??
      'https://en.wikipedia.org/w/api.php';
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      generator: 'search',
      gsrsearch: `${this.toPlainText(site.nameEn) ?? site.nameEn} UNESCO World Heritage Site`,
      gsrnamespace: '0',
      gsrlimit: '5',
      prop: 'pageimages|info',
      piprop: 'name|original|thumbnail',
      pithumbsize: '1600',
      inprop: 'url',
      origin: '*',
    });

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        headers: {
          'Api-User-Agent':
            this.configService.get<string>('WIKIMEDIA_USER_AGENT') ??
            'WorldHeritageAtlas/1.0 (personal learning application)',
        },
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        return site;
      }

      const data = (await response.json()) as WikipediaResponse;
      const pages = Object.values(data.query?.pages ?? {}).sort(
        (left, right) =>
          (left.index ?? Number.MAX_SAFE_INTEGER) -
          (right.index ?? Number.MAX_SAFE_INTEGER),
      );
      const page = pages.find(
        (candidate) =>
          (candidate.original?.source || candidate.thumbnail?.source) &&
          this.isRelevantWikipediaTitle(site.nameEn, candidate.title),
      );
      const imageUrl =
        page?.original?.source ?? page?.thumbnail?.source ?? null;
      const attribution = page?.pageimage
        ? await this.fetchAttribution(apiUrl, page.pageimage).catch(() => null)
        : null;

      site.wikipediaImageUrl = imageUrl;
      site.wikipediaPageUrl = page?.fullurl ?? null;
      site.wikipediaImageAuthor = attribution?.author ?? null;
      site.wikipediaImageLicense = attribution?.license ?? null;
      site.wikipediaImageFetchedAt = new Date();
      await this.heritageRepository.save(site);
    } catch {
      // Image enrichment is best-effort and must never block reading.
    }

    return site;
  }

  getDisplayImageUrl(site: WorldHeritageSite) {
    if (this.isUsableMainImageUrl(site.mainImageUrl)) {
      return site.mainImageUrl;
    }
    return this.hasRelevantWikipediaImage(site) ? site.wikipediaImageUrl : null;
  }

  private hasRelevantWikipediaImage(site: WorldHeritageSite) {
    if (!site.wikipediaImageUrl) return false;
    const title = this.wikipediaTitleFromUrl(site.wikipediaPageUrl);
    return title !== null && this.isRelevantWikipediaTitle(site.nameEn, title);
  }

  private wikipediaTitleFromUrl(url: string | null) {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith('wikipedia.org')) return null;
      const match = parsed.pathname.match(/^\/wiki\/(.+)$/);
      return match ? decodeURIComponent(match[1]).replace(/_/g, ' ') : null;
    } catch {
      return null;
    }
  }

  private isRelevantWikipediaTitle(siteName: string, candidateTitle?: string) {
    if (!candidateTitle) return false;

    const normalizedSiteName = this.normalizeTitle(siteName);
    const normalizedCandidate = this.normalizeTitle(candidateTitle);
    if (
      !normalizedCandidate ||
      GENERIC_WIKIPEDIA_TITLES.has(normalizedCandidate) ||
      normalizedCandidate.startsWith('list of world heritage sites')
    ) {
      return false;
    }
    if (
      normalizedSiteName === normalizedCandidate ||
      normalizedSiteName.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedSiteName)
    ) {
      return true;
    }

    const siteTokens = this.titleTokens(normalizedSiteName);
    const candidateTokens = this.titleTokens(normalizedCandidate);
    const smallerTokenCount = Math.min(siteTokens.size, candidateTokens.size);
    if (smallerTokenCount === 0) return false;

    const firstSiteToken = siteTokens.values().next().value as
      string | undefined;
    const firstCandidateToken = candidateTokens.values().next().value as
      string | undefined;
    if (
      !firstSiteToken ||
      !firstCandidateToken ||
      !this.areMatchingTitleTokens(firstSiteToken, firstCandidateToken)
    ) {
      return false;
    }

    const overlap = [...candidateTokens].filter((candidateToken) =>
      [...siteTokens].some((siteToken) =>
        this.areMatchingTitleTokens(siteToken, candidateToken),
      ),
    ).length;
    const minimumOverlap = Math.min(2, smallerTokenCount);
    return overlap >= minimumOverlap && overlap / smallerTokenCount >= 0.6;
  }

  private normalizeTitle(value: string) {
    return (
      this.toPlainText(value)
        ?.normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
        .trim() ?? ''
    );
  }

  private titleTokens(value: string) {
    return new Set(
      value
        .split(' ')
        .filter((token) => token.length > 1 && !TITLE_STOP_WORDS.has(token)),
    );
  }

  private areMatchingTitleTokens(left: string, right: string) {
    if (left === right) return true;
    if (Math.max(left.length, right.length) < 5) return false;
    if (Math.abs(left.length - right.length) > 1) return false;

    let leftIndex = 0;
    let rightIndex = 0;
    let edits = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
      if (left[leftIndex] === right[rightIndex]) {
        leftIndex += 1;
        rightIndex += 1;
        continue;
      }
      edits += 1;
      if (edits > 1) return false;
      if (left.length > right.length) leftIndex += 1;
      else if (right.length > left.length) rightIndex += 1;
      else {
        leftIndex += 1;
        rightIndex += 1;
      }
    }
    if (leftIndex < left.length || rightIndex < right.length) edits += 1;
    return edits <= 1;
  }

  private isUsableMainImageUrl(url: string | null) {
    if (!url) return false;

    try {
      const parsed = new URL(url);
      // UNESCO's document endpoint is protected by an interactive Cloudflare
      // challenge, so it cannot be embedded in an <img>. Use Wikimedia's
      // openly embeddable image instead.
      return !(
        parsed.hostname === 'whc.unesco.org' &&
        parsed.pathname.startsWith('/document/')
      );
    } catch {
      return false;
    }
  }

  private wasRecentlyFetched(fetchedAt: Date | null) {
    if (!fetchedAt) return false;
    return Date.now() - fetchedAt.getTime() < FAILED_FETCH_RETRY_MS;
  }

  private async fetchAttribution(apiUrl: string, filename: string) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      titles: `File:${filename}`,
      prop: 'imageinfo',
      iiprop: 'extmetadata',
      origin: '*',
    });
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      headers: {
        'Api-User-Agent':
          this.configService.get<string>('WIKIMEDIA_USER_AGENT') ??
          'WorldHeritageAtlas/1.0 (personal learning application)',
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as WikipediaResponse;
    const page = Object.values(data.query?.pages ?? {})[0];
    const metadata = page?.imageinfo?.[0]?.extmetadata;
    return {
      author: this.toPlainText(
        metadata?.Artist?.value ?? metadata?.Credit?.value,
      ),
      license: this.toPlainText(metadata?.LicenseShortName?.value),
    };
  }

  private toPlainText(value?: string) {
    if (!value) return null;
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}
