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
const DISPLAY_IMAGE_WIDTH = 960;
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
  'from',
  'historic',
  'in',
  'its',
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
  'to',
  'unesco',
  'world',
  'with',
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
    const hasStoredWikipediaImage = Boolean(site.wikipediaImageUrl);
    if (
      this.hasRelevantWikipediaImage(site) ||
      this.isUsableMainImageUrl(site.mainImageUrl) ||
      (!hasStoredWikipediaImage &&
        this.wasRecentlyFetched(site.wikipediaImageFetchedAt))
    ) {
      return site;
    }

    if (hasStoredWikipediaImage) this.clearWikipediaImage(site);

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
        await this.markImageLookupFailed(site);
        return site;
      }

      const data = (await response.json()) as WikipediaResponse;
      const pages = Object.values(data.query?.pages ?? {}).sort(
        (left, right) =>
          (left.index ?? Number.MAX_SAFE_INTEGER) -
          (right.index ?? Number.MAX_SAFE_INTEGER),
      );
      const page = pages
        .filter(
          (candidate) =>
            candidate.original?.source || candidate.thumbnail?.source,
        )
        .map((candidate) => ({
          candidate,
          relevance: this.wikipediaTitleRelevance(site.nameEn, candidate.title),
        }))
        .filter(({ relevance }) => relevance > 0)
        .sort(
          (left, right) =>
            right.relevance - left.relevance ||
            (left.candidate.index ?? Number.MAX_SAFE_INTEGER) -
              (right.candidate.index ?? Number.MAX_SAFE_INTEGER),
        )[0]?.candidate;
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
      await this.markImageLookupFailed(site);
    }

    return site;
  }

  getDisplayImageUrl(site: WorldHeritageSite) {
    if (this.isUsableMainImageUrl(site.mainImageUrl)) {
      return site.mainImageUrl;
    }
    return this.getWikipediaDisplayImageUrl(site);
  }

  getWikipediaDisplayImageUrl(site: WorldHeritageSite) {
    return this.hasRelevantWikipediaImage(site)
      ? this.toWikimediaThumbnail(site.wikipediaImageUrl!)
      : null;
  }

  private hasRelevantWikipediaImage(site: WorldHeritageSite) {
    if (!site.wikipediaImageUrl) return false;
    const title = this.wikipediaTitleFromUrl(site.wikipediaPageUrl);
    return (
      title !== null && this.wikipediaTitleRelevance(site.nameEn, title) > 0
    );
  }

  private clearWikipediaImage(site: WorldHeritageSite) {
    site.wikipediaImageUrl = null;
    site.wikipediaPageUrl = null;
    site.wikipediaImageAuthor = null;
    site.wikipediaImageLicense = null;
  }

  private async markImageLookupFailed(site: WorldHeritageSite) {
    this.clearWikipediaImage(site);
    site.wikipediaImageFetchedAt = new Date();
    await this.heritageRepository.save(site).catch(() => undefined);
  }

  private wikipediaTitleFromUrl(url: string | null) {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      const isWikipediaHost =
        parsed.hostname === 'wikipedia.org' ||
        parsed.hostname.endsWith('.wikipedia.org');
      if (!isWikipediaHost) return null;
      const match = parsed.pathname.match(/^\/wiki\/(.+)$/);
      return match ? decodeURIComponent(match[1]).replace(/_/g, ' ') : null;
    } catch {
      return null;
    }
  }

  private wikipediaTitleRelevance(siteName: string, candidateTitle?: string) {
    if (!candidateTitle) return 0;

    const normalizedSiteName = this.normalizeTitle(siteName);
    const normalizedCandidate = this.normalizeTitle(candidateTitle);
    if (
      !normalizedCandidate ||
      GENERIC_WIKIPEDIA_TITLES.has(normalizedCandidate) ||
      normalizedCandidate.startsWith('list of world heritage sites')
    ) {
      return 0;
    }
    if (
      normalizedSiteName === normalizedCandidate ||
      normalizedSiteName.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedSiteName)
    ) {
      return normalizedSiteName === normalizedCandidate ? 1 : 0.9;
    }

    const siteTokens = this.titleTokens(normalizedSiteName);
    const candidateTokens = this.titleTokens(normalizedCandidate);
    const smallerTokenCount = Math.min(siteTokens.size, candidateTokens.size);
    if (smallerTokenCount === 0) return 0;

    const firstSiteToken = siteTokens.values().next().value as
      string | undefined;
    const firstCandidateToken = candidateTokens.values().next().value as
      string | undefined;
    const overlap = [...candidateTokens].filter((candidateToken) =>
      [...siteTokens].some((siteToken) =>
        this.areMatchingTitleTokens(siteToken, candidateToken),
      ),
    ).length;
    const firstTokenMatches =
      Boolean(firstSiteToken) &&
      Boolean(firstCandidateToken) &&
      this.areMatchingTitleTokens(firstSiteToken!, firstCandidateToken!);
    const overlapRatio =
      overlap / Math.max(siteTokens.size, candidateTokens.size);
    if (overlapRatio < 0.5 || (!firstTokenMatches && overlap < 3)) return 0;
    return overlapRatio + (firstTokenMatches ? 0.05 : 0);
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

  private toWikimediaThumbnail(url: string) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (
        parsed.hostname !== 'upload.wikimedia.org' ||
        parts[0] !== 'wikipedia' ||
        parts[1] !== 'commons' ||
        parts[2] === 'thumb' ||
        parts.length < 5
      ) {
        return url;
      }
      const [firstHash, secondHash, ...fileParts] = parts.slice(2);
      const filename = fileParts.join('/');
      const thumbnailName = `${DISPLAY_IMAGE_WIDTH}px-${filename}${filename.toLowerCase().endsWith('.svg') ? '.png' : ''}`;
      parsed.pathname = `/wikipedia/commons/thumb/${firstHash}/${secondHash}/${filename}/${thumbnailName}`;
      parsed.search = '';
      return parsed.toString();
    } catch {
      return url;
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
