import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { DeepLService } from './deepl.service';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  const repository = {
    findOneBy: jest.fn(),
  };
  const deepLService = {
    translateTexts: jest.fn(),
  };
  const service = new TranslationService(
    repository as unknown as Repository<WorldHeritageSite>,
    deepLService as unknown as DeepLService,
  );

  beforeEach(() => {
    repository.findOneBy.mockReset();
    deepLService.translateTexts.mockReset();
  });

  it('returns stored article translations without calling DeepL', async () => {
    repository.findOneBy.mockResolvedValue({
      nameJa: 'ガラパゴス諸島',
      shortDescriptionJa: '日本語の概要',
      descriptionJa: '日本語の説明',
      justificationJa: '日本語の登録理由',
      criteriaTextJa: '(vii)(viii)(ix)(x)',
      mainImageCaptionJa: null,
    });

    await expect(service.translateArticle('site-id')).resolves.toEqual({
      nameEn: 'ガラパゴス諸島',
      shortDescriptionEn: '日本語の概要',
      descriptionEn: '日本語の説明',
      justificationEn: '日本語の登録理由',
      criteriaText: '(vii)(viii)(ix)(x)',
    });
    expect(deepLService.translateTexts).not.toHaveBeenCalled();
  });

  it('keeps DeepL for user-selected text translation', async () => {
    deepLService.translateTexts.mockResolvedValue(['世界遺産']);

    await expect(
      service.translateSelection('World Heritage', 'A World Heritage Site.'),
    ).resolves.toEqual({ translationJa: '世界遺産' });
    expect(deepLService.translateTexts).toHaveBeenCalledWith(
      ['World Heritage'],
      'A World Heritage Site.',
    );
  });
});
