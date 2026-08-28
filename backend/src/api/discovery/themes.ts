export type ThemeDefinition = {
  slug: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  keywords?: string[];
  category?: string;
  country?: string;
};

export const heritageThemes: ThemeDefinition[] = [
  {
    slug: 'ancient-sites',
    nameJa: '古代遺跡',
    nameEn: 'Ancient Sites',
    descriptionJa: '古代文明、考古遺跡、先史時代の世界遺産',
    keywords: ['ancient', 'archaeological', 'prehistoric', 'roman', 'temple'],
  },
  {
    slug: 'castles-palaces',
    nameJa: '城・宮殿',
    nameEn: 'Castles & Palaces',
    descriptionJa: '城塞、宮殿、要塞都市を英語で巡る',
    keywords: ['castle', 'palace', 'fortress', 'fortified', 'citadel'],
  },
  {
    slug: 'national-parks',
    nameJa: '国立公園',
    nameEn: 'National Parks',
    descriptionJa: '自然を守る国立公園のコレクション',
    category: 'Natural',
    keywords: ['national park'],
  },
  {
    slug: 'endangered-species',
    nameJa: '絶滅危惧種',
    nameEn: 'Endangered Species',
    descriptionJa: '希少な動植物と生息地を守る世界遺産',
    keywords: ['endangered', 'threatened', 'rare species', 'biodiversity'],
  },
  {
    slug: 'volcanoes',
    nameJa: '火山',
    nameEn: 'Volcanoes',
    descriptionJa: '火山、カルデラ、溶岩が形作った景観',
    keywords: ['volcano', 'volcanic', 'caldera', 'lava'],
  },
  {
    slug: 'marine-heritage',
    nameJa: '海洋遺産',
    nameEn: 'Marine Heritage',
    descriptionJa: '海、島、サンゴ礁、沿岸の自然遺産',
    keywords: ['marine', 'coral', 'reef', 'coast', 'ocean', 'island'],
  },
  {
    slug: 'japan',
    nameJa: '日本と関係の深い遺産',
    nameEn: 'Heritage of Japan',
    descriptionJa: '日本に所在する世界遺産をまとめて読む',
    country: 'Japan',
  },
];
