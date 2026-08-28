import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleHighlight } from '../../database/entities/article-highlight.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

export type SaveHighlightInput = {
  heritageSiteId?: unknown;
  sectionKey?: unknown;
  startOffset?: unknown;
  endOffset?: unknown;
  selectedText?: unknown;
  noteJa?: unknown;
  difficultyReason?: unknown;
  reasonDetail?: unknown;
};

@Injectable()
export class HighlightsService {
  constructor(
    @InjectRepository(ArticleHighlight)
    private readonly highlightRepository: Repository<ArticleHighlight>,
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
  ) {}

  async getForSite(heritageSiteId: string) {
    await this.requireSite(heritageSiteId);
    return this.highlightRepository.find({
      where: { heritageSiteId },
      order: { sectionKey: 'ASC', startOffset: 'ASC' },
    });
  }

  async create(input: SaveHighlightInput) {
    const heritageSiteId = this.requireString(
      input.heritageSiteId,
      'heritageSiteId',
      100,
    );
    const sectionKey = this.requireString(input.sectionKey, 'sectionKey', 120);
    const selectedText = this.requireString(
      input.selectedText,
      'selectedText',
      4_000,
    );
    const startOffset = this.requireOffset(input.startOffset, 'startOffset');
    const endOffset = this.requireOffset(input.endOffset, 'endOffset');
    if (endOffset <= startOffset) {
      throw new BadRequestException('endOffset must be after startOffset.');
    }
    if (endOffset - startOffset !== selectedText.length) {
      throw new BadRequestException(
        'The selected text must match the selected range.',
      );
    }
    await this.requireSite(heritageSiteId);

    const existing = await this.highlightRepository.findOneBy({
      heritageSiteId,
      sectionKey,
      startOffset,
      endOffset,
    });
    const values = {
      heritageSiteId,
      sectionKey,
      startOffset,
      endOffset,
      selectedText,
      noteJa: this.optionalString(input.noteJa, 5_000),
      difficultyReason: this.optionalString(input.difficultyReason, 40) || null,
      reasonDetail: this.optionalString(input.reasonDetail, 2_000),
    };
    return this.highlightRepository.save(
      existing
        ? Object.assign(existing, values)
        : this.highlightRepository.create(values),
    );
  }

  async update(id: number, input: Partial<SaveHighlightInput>) {
    const highlight = await this.highlightRepository.findOneBy({ id });
    if (!highlight) throw new NotFoundException('Highlight was not found.');
    if ('noteJa' in input) {
      highlight.noteJa = this.optionalString(input.noteJa, 5_000);
    }
    if ('difficultyReason' in input) {
      highlight.difficultyReason =
        this.optionalString(input.difficultyReason, 40) || null;
    }
    if ('reasonDetail' in input) {
      highlight.reasonDetail = this.optionalString(input.reasonDetail, 2_000);
    }
    return this.highlightRepository.save(highlight);
  }

  async remove(id: number) {
    const result = await this.highlightRepository.delete(id);
    if (!result.affected)
      throw new NotFoundException('Highlight was not found.');
  }

  private requireOffset(value: unknown, field: string) {
    if (!Number.isInteger(value) || (value as number) < 0) {
      throw new BadRequestException(`${field} must be a positive integer.`);
    }
    return value as number;
  }

  private requireString(value: unknown, field: string, maxLength: number) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required.`);
    }
    const result = value.trim();
    if (result.length > maxLength) {
      throw new BadRequestException(`${field} is too long.`);
    }
    return result;
  }

  private optionalString(value: unknown, maxLength: number) {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string') {
      throw new BadRequestException('Text fields must be strings.');
    }
    const result = value.trim();
    if (result.length > maxLength) {
      throw new BadRequestException('A text field is too long.');
    }
    return result;
  }

  private async requireSite(id: string) {
    if (!(await this.heritageRepository.exists({ where: { uuid: id } }))) {
      throw new NotFoundException('World Heritage site was not found.');
    }
  }
}
