import { Repository } from 'typeorm';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { LibreTranslateService } from './libretranslate.service';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  const repository = {
    findOneBy: jest.fn(),
  };
  const libreTranslateService = {
    translateTexts: jest.fn(),
  };
  const service = new TranslationService(
    repository as unknown as Repository<WorldHeritageSite>,
    libreTranslateService as unknown as LibreTranslateService,
  );

  beforeEach(() => {
    repository.findOneBy.mockReset();
    libreTranslateService.translateTexts.mockReset();
  });

  it('returns stored article translations without calling an API', async () => {
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
    expect(libreTranslateService.translateTexts).not.toHaveBeenCalled();
  });

  it('uses LibreTranslate for user-selected text translation', async () => {
    libreTranslateService.translateTexts.mockResolvedValue(['世界遺産']);

    await expect(
      service.translateSelection('World Heritage', 'A World Heritage Site.'),
    ).resolves.toEqual({ translationJa: '世界遺産' });
    expect(libreTranslateService.translateTexts).toHaveBeenCalledWith([
      'World Heritage',
    ]);
  });
});
