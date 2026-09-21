import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { WikipediaMediaService } from './wikipedia-media.service';

export type PdfLanguage = 'en' | 'ja' | 'both';

type HeritagePdf = {
  buffer: Buffer;
  filename: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_MARGIN = 48;
const BODY_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const PDF_IMAGE_WIDTH = 960;
const TEXT_COLOR = '#18352f';
const MUTED_COLOR = '#53645d';
const ACCENT_COLOR = '#b85635';

@Injectable()
export class HeritagePdfService {
  private readonly regularFont = this.fontPath('NotoSansJP-Regular.otf');
  private readonly boldFont = this.fontPath('NotoSansJP-Bold.otf');

  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    private readonly wikipediaMediaService: WikipediaMediaService,
  ) {}

  async createPdf(
    id: string,
    requestedLanguage: string | undefined,
  ): Promise<HeritagePdf> {
    const site = await this.heritageRepository.findOneBy({ uuid: id });
    if (!site) {
      throw new NotFoundException('World Heritage site was not found.');
    }

    const language = this.normalizeLanguage(requestedLanguage);
    const enrichedSite =
      await this.wikipediaMediaService.fillMissingImage(site);
    const imageUrl = this.wikipediaMediaService.getDisplayImageUrl(
      enrichedSite,
      PDF_IMAGE_WIDTH,
    );
    const image = imageUrl ? await this.fetchImage(imageUrl) : null;
    const buffer = await this.renderPdf(enrichedSite, language, image);

    return {
      buffer,
      filename: `${this.safeFilename(enrichedSite.nameEn)}.pdf`,
    };
  }

  private async renderPdf(
    site: WorldHeritageSite,
    language: PdfLanguage,
    image: Buffer | null,
  ) {
    const chunks: Buffer[] = [];
    const document = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      info: {
        Author: 'World Heritage Atlas',
        Creator: 'World Heritage Atlas',
        Title: site.nameEn,
        Subject: 'World Heritage learning notes',
      },
    });

    const completed = new Promise<Buffer>((resolve, reject) => {
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    document.font(this.regularFont).fillColor(TEXT_COLOR);
    this.addHeader(document);
    this.addTitle(document, site);
    this.addMetadata(document, site);

    if (image) {
      this.addImage(document, image);
      this.addImageAttribution(document, site);
    } else {
      this.addSectionHeading(document, 'Image');
      this.addBody(
        document,
        'No embeddable image was available for this site.',
      );
    }

    this.addLocalizedSection(
      document,
      'Overview',
      site.shortDescriptionEn,
      site.shortDescriptionJa,
      language,
    );
    this.addLocalizedSection(
      document,
      'Description',
      site.descriptionEn,
      site.descriptionJa,
      language,
    );
    this.addLocalizedSection(
      document,
      'Why it was inscribed',
      site.justificationEn,
      site.justificationJa,
      language,
    );
    this.addLocalizedSection(
      document,
      'Heritage criteria',
      site.criteriaText,
      site.criteriaTextJa,
      language,
    );

    this.addSources(document, site);
    document.end();

    return completed;
  }

  private addHeader(document: PDFKit.PDFDocument) {
    document
      .save()
      .fillColor(ACCENT_COLOR)
      .rect(PAGE_MARGIN, PAGE_MARGIN - 16, BODY_WIDTH, 3)
      .fill()
      .restore();
    document
      .font(this.boldFont)
      .fontSize(8)
      .fillColor(ACCENT_COLOR)
      .text('WORLD HERITAGE ATLAS', PAGE_MARGIN, PAGE_MARGIN - 7, {
        characterSpacing: 1.2,
      });
    document.moveDown(1.5);
  }

  private addTitle(document: PDFKit.PDFDocument, site: WorldHeritageSite) {
    document
      .font(this.boldFont)
      .fontSize(25)
      .fillColor(TEXT_COLOR)
      .text(site.nameEn, { width: BODY_WIDTH, lineGap: 3 });
    if (site.nameJa) {
      document
        .moveDown(0.35)
        .font(this.regularFont)
        .fontSize(12)
        .fillColor(ACCENT_COLOR)
        .text(site.nameJa, { width: BODY_WIDTH });
    }
    document.moveDown(0.8);
  }

  private addMetadata(document: PDFKit.PDFDocument, site: WorldHeritageSite) {
    const metadata = [
      ['Category', this.categoryLabel(site.category)],
      [
        'Location',
        [...site.statesNames, site.region].filter(Boolean).join(' / '),
      ],
      ['Inscribed', site.dateInscribed?.toString() ?? '—'],
      ['UNESCO ID', site.unescoId],
    ] as const;

    document
      .save()
      .fillColor('#e7dfd0')
      .roundedRect(PAGE_MARGIN, document.y, BODY_WIDTH, 64, 4)
      .fill()
      .restore();

    const top = document.y + 13;
    const columnWidth = BODY_WIDTH / 2;
    metadata.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = PAGE_MARGIN + column * columnWidth + 12;
      const y = top + row * 25;
      document
        .font(this.boldFont)
        .fontSize(7)
        .fillColor(MUTED_COLOR)
        .text(label.toUpperCase(), x, y, { width: columnWidth - 24 });
      document
        .font(this.regularFont)
        .fontSize(9)
        .fillColor(TEXT_COLOR)
        .text(value || '—', x, y + 9, { width: columnWidth - 24 });
    });
    document.x = PAGE_MARGIN;
    document.y = top + 61;
    document.moveDown(1.1);
  }

  private addImage(document: PDFKit.PDFDocument, image: Buffer) {
    const imageTop = document.y;
    const imageHeight = 250;
    if (imageTop + imageHeight > 760) {
      document.addPage();
      this.addHeader(document);
    }
    const top = document.y;
    document.image(image, PAGE_MARGIN, top, {
      fit: [BODY_WIDTH, imageHeight],
      align: 'center',
      valign: 'center',
    });
    document.y = top + imageHeight + 14;
  }

  private addImageAttribution(
    document: PDFKit.PDFDocument,
    site: WorldHeritageSite,
  ) {
    const author = site.mainImageAuthor ?? site.wikipediaImageAuthor;
    const license = site.mainImageLicense ?? site.wikipediaImageLicense;
    const source = site.wikipediaPageUrl ?? site.mainImageSourceUrl;
    const details = [
      site.mainImageCaptionEn,
      author ? `Photo: ${author}` : null,
      license ? `License: ${license}` : null,
      source ? `Source: ${source}` : null,
    ].filter(Boolean);

    if (details.length) {
      document
        .font(this.regularFont)
        .fontSize(7)
        .fillColor(MUTED_COLOR)
        .text(details.join('  '), { width: BODY_WIDTH, lineGap: 2 });
      document.moveDown(0.8);
    }
  }

  private addLocalizedSection(
    document: PDFKit.PDFDocument,
    heading: string,
    english: string | null,
    japanese: string | null,
    language: PdfLanguage,
  ) {
    const sections = this.localizedValues(english, japanese, language);
    if (!sections.length) return;

    this.addSectionHeading(document, heading);
    sections.forEach(({ label, value }) => {
      if (sections.length > 1) {
        document
          .font(this.boldFont)
          .fontSize(8)
          .fillColor(ACCENT_COLOR)
          .text(label.toUpperCase(), { width: BODY_WIDTH });
        document.moveDown(0.2);
      }
      this.addBody(document, value);
    });
  }

  private addSectionHeading(document: PDFKit.PDFDocument, heading: string) {
    if (document.y > 680) {
      document.addPage();
      this.addHeader(document);
    }
    document.moveDown(0.6);
    document
      .font(this.boldFont)
      .fontSize(14)
      .fillColor(TEXT_COLOR)
      .text(heading, { width: BODY_WIDTH });
    document
      .save()
      .fillColor(ACCENT_COLOR)
      .rect(PAGE_MARGIN, document.y + 4, 34, 2)
      .fill()
      .restore();
    document.moveDown(0.65);
  }

  private addBody(document: PDFKit.PDFDocument, text: string) {
    document
      .font(this.regularFont)
      .fontSize(10)
      .fillColor(TEXT_COLOR)
      .text(text, { width: BODY_WIDTH, lineGap: 4, paragraphGap: 8 });
    document.moveDown(0.25);
  }

  private addSources(document: PDFKit.PDFDocument, site: WorldHeritageSite) {
    this.addSectionHeading(document, 'Sources');
    const sources = [
      `UNESCO: https://whc.unesco.org/en/list/${site.unescoId}`,
      site.wikipediaPageUrl ? `Wikipedia: ${site.wikipediaPageUrl}` : null,
    ].filter(Boolean);
    this.addBody(document, sources.join('\n'));
    document
      .font(this.regularFont)
      .fontSize(7)
      .fillColor(MUTED_COLOR)
      .text(`Generated ${new Date().toISOString().slice(0, 10)}`, {
        width: BODY_WIDTH,
      });
  }

  private localizedValues(
    english: string | null,
    japanese: string | null,
    language: PdfLanguage,
  ) {
    if (language === 'en') {
      return english ? [{ label: 'English', value: english }] : [];
    }
    if (language === 'ja') {
      return [{ label: '日本語', value: japanese ?? english }].filter(
        (section): section is { label: string; value: string } =>
          Boolean(section.value),
      );
    }
    return [
      english ? { label: 'English', value: english } : null,
      japanese ? { label: '日本語', value: japanese } : null,
    ].filter((section): section is { label: string; value: string } =>
      Boolean(section),
    );
  }

  private async fetchImage(url: string) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (
        !response.ok ||
        !response.headers.get('content-type')?.startsWith('image/')
      ) {
        return null;
      }
      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }

  private normalizeLanguage(language: string | undefined): PdfLanguage {
    return language === 'en' || language === 'ja' ? language : 'both';
  }

  private categoryLabel(category: WorldHeritageSite['category']) {
    return {
      Cultural: 'Cultural / 文化',
      Natural: 'Natural / 自然',
      Mixed: 'Mixed / 複合',
    }[category];
  }

  private safeFilename(name: string) {
    const normalized = [...name]
      .map((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127 || /[<>:"/\\|?*]/.test(character)
          ? ' '
          : character;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    return (normalized || 'world-heritage').slice(0, 120);
  }

  private fontPath(filename: string) {
    const candidates = [
      process.env.PDF_FONT_DIR
        ? path.resolve(process.env.PDF_FONT_DIR, filename)
        : null,
      path.resolve(
        process.cwd(),
        'node_modules',
        '@embedpdf',
        'fonts-jp',
        'fonts',
        filename,
      ),
      typeof __dirname === 'string'
        ? path.resolve(
            __dirname,
            '../../../node_modules/@embedpdf/fonts-jp/fonts',
            filename,
          )
        : null,
    ].filter((candidate): candidate is string => Boolean(candidate));
    const found = candidates.find((candidate) => existsSync(candidate));
    if (!found) {
      throw new Error(
        `PDF font was not found. Set PDF_FONT_DIR or install @embedpdf/fonts-jp: ${filename}`,
      );
    }
    return found;
  }
}
