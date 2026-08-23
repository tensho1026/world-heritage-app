import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

type WikipediaPage = {
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

@Injectable()
export class WikipediaMediaService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    private readonly configService: ConfigService,
  ) {}

  async fillMissingImage(site: WorldHeritageSite): Promise<WorldHeritageSite> {
    if (
      site.mainImageUrl ||
      site.wikipediaImageUrl ||
      site.wikipediaImageFetchedAt
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
      gsrsearch: `${site.nameEn} UNESCO World Heritage Site`,
      gsrnamespace: '0',
      gsrlimit: '1',
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
      const page = Object.values(data.query?.pages ?? {})[0];
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
