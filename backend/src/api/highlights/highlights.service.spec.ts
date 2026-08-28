import { Repository } from 'typeorm';
import { ArticleHighlight } from '../../database/entities/article-highlight.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { HighlightsService } from './highlights.service';

describe('HighlightsService', () => {
  const highlightRepository = {
    findOneBy: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 1, ...value })),
    find: jest.fn(),
    delete: jest.fn(),
  };
  const heritageRepository = { exist: jest.fn() };
  const service = new HighlightsService(
    highlightRepository as unknown as Repository<ArticleHighlight>,
    heritageRepository as unknown as Repository<WorldHeritageSite>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    heritageRepository.exist.mockResolvedValue(true);
    highlightRepository.findOneBy.mockResolvedValue(null);
  });

  it('stores a selected range with a Japanese note and reason', async () => {
    await expect(
      service.create({
        heritageSiteId: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
        sectionKey: 'description-0',
        startOffset: 4,
        endOffset: 18,
        selectedText: 'selected words',
        noteJa: '構文を確認する',
        difficultyReason: 'grammar',
        reasonDetail: '修飾先が不明',
      }),
    ).resolves.toMatchObject({
      selectedText: 'selected words',
      noteJa: '構文を確認する',
      difficultyReason: 'grammar',
    });
  });

  it('rejects a range that does not match the selected text', async () => {
    await expect(
      service.create({
        heritageSiteId: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
        sectionKey: 'description-0',
        startOffset: 0,
        endOffset: 3,
        selectedText: 'different length',
      }),
    ).rejects.toThrow('selected text must match');
  });
});
