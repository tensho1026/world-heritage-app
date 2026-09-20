import { themeFilters } from './theme-filter';

describe('themeFilters', () => {
  it('normalizes every supported theme constraint in a stable order', () => {
    expect(
      themeFilters({
        slug: 'sample',
        group: 'subject',
        nameJa: 'サンプル',
        nameEn: 'Sample',
        descriptionJa: '説明',
        country: 'Japan',
        keywords: ['temple', 'shrine'],
        category: 'Cultural',
        region: 'Asia and the Pacific',
        danger: true,
        transboundary: true,
      }),
    ).toEqual([
      { kind: 'country', value: 'Japan' },
      { kind: 'keywords', values: ['temple', 'shrine'] },
      { kind: 'category', value: 'Cultural' },
      { kind: 'region', value: 'Asia and the Pacific' },
      { kind: 'danger' },
      { kind: 'transboundary' },
    ]);
  });

  it('returns no constraints for a presentation-only theme', () => {
    expect(
      themeFilters({
        slug: 'all',
        group: 'subject',
        nameJa: 'すべて',
        nameEn: 'All',
        descriptionJa: '説明',
      }),
    ).toEqual([]);
  });
});
