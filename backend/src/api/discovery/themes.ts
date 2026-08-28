export type ThemeDefinition = {
  slug: string;
  group: 'subject' | 'category' | 'region' | 'country' | 'status';
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  keywords?: string[];
  category?: string;
  country?: string;
  region?: string;
  danger?: boolean;
  transboundary?: boolean;
};

export const heritageThemes: ThemeDefinition[] = [
  {
    slug: 'ancient-sites',
    group: 'subject',
    nameJa: '古代遺跡',
    nameEn: 'Ancient Sites',
    descriptionJa: '古代文明、考古遺跡、先史時代の世界遺産',
    keywords: ['ancient', 'archaeological', 'prehistoric', 'roman', 'temple'],
  },
  {
    slug: 'castles-palaces',
    group: 'subject',
    nameJa: '城・宮殿',
    nameEn: 'Castles & Palaces',
    descriptionJa: '城塞、宮殿、要塞都市を英語で巡る',
    keywords: ['castle', 'palace', 'fortress', 'fortified', 'citadel'],
  },
  {
    slug: 'national-parks',
    group: 'subject',
    nameJa: '国立公園',
    nameEn: 'National Parks',
    descriptionJa: '自然を守る国立公園のコレクション',
    category: 'Natural',
    keywords: ['national park'],
  },
  {
    slug: 'endangered-species',
    group: 'subject',
    nameJa: '絶滅危惧種',
    nameEn: 'Endangered Species',
    descriptionJa: '希少な動植物と生息地を守る世界遺産',
    keywords: ['endangered', 'threatened', 'rare species', 'biodiversity'],
  },
  {
    slug: 'volcanoes',
    group: 'subject',
    nameJa: '火山',
    nameEn: 'Volcanoes',
    descriptionJa: '火山、カルデラ、溶岩が形作った景観',
    keywords: ['volcano', 'volcanic', 'caldera', 'lava'],
  },
  {
    slug: 'marine-heritage',
    group: 'subject',
    nameJa: '海洋遺産',
    nameEn: 'Marine Heritage',
    descriptionJa: '海、島、サンゴ礁、沿岸の自然遺産',
    keywords: ['marine', 'coral', 'reef', 'coast', 'ocean', 'island'],
  },
  {
    slug: 'japan',
    group: 'country',
    nameJa: '日本と関係の深い遺産',
    nameEn: 'Heritage of Japan',
    descriptionJa: '日本に所在する世界遺産をまとめて読む',
    country: 'Japan',
  },
  {
    slug: 'cultural-heritage',
    group: 'category',
    nameJa: '文化遺産',
    nameEn: 'Cultural Heritage',
    descriptionJa: '建築、都市、遺跡など人の営みが生んだ世界遺産',
    category: 'Cultural',
  },
  {
    slug: 'natural-heritage',
    group: 'category',
    nameJa: '自然遺産',
    nameEn: 'Natural Heritage',
    descriptionJa: '地形、生態系、生物多様性を守る世界遺産',
    category: 'Natural',
  },
  {
    slug: 'mixed-heritage',
    group: 'category',
    nameJa: '複合遺産',
    nameEn: 'Mixed Heritage',
    descriptionJa: '文化と自然の両方に価値を持つ世界遺産',
    category: 'Mixed',
  },
  {
    slug: 'asia-pacific',
    group: 'region',
    nameJa: 'アジア・太平洋',
    nameEn: 'Asia and the Pacific',
    descriptionJa: 'アジアと太平洋地域の世界遺産を横断して読む',
    region: 'Asia and the Pacific',
  },
  {
    slug: 'europe-north-america',
    group: 'region',
    nameJa: 'ヨーロッパ・北米',
    nameEn: 'Europe and North America',
    descriptionJa: 'ヨーロッパと北米地域の世界遺産を巡る',
    region: 'Europe and North America',
  },
  {
    slug: 'africa',
    group: 'region',
    nameJa: 'アフリカ',
    nameEn: 'Africa',
    descriptionJa: 'アフリカ地域の文化と自然を英語で知る',
    region: 'Africa',
  },
  {
    slug: 'latin-america-caribbean',
    group: 'region',
    nameJa: '中南米・カリブ海',
    nameEn: 'Latin America and the Caribbean',
    descriptionJa: '中南米とカリブ海地域の世界遺産を巡る',
    region: 'Latin America and the Caribbean',
  },
  {
    slug: 'arab-states',
    group: 'region',
    nameJa: 'アラブ諸国',
    nameEn: 'Arab States',
    descriptionJa: 'アラブ諸国の歴史と景観を英語で読む',
    region: 'Arab States',
  },
  {
    slug: 'in-danger',
    group: 'status',
    nameJa: '危機遺産',
    nameEn: 'Heritage in Danger',
    descriptionJa: '保全上の危機に直面している世界遺産',
    danger: true,
  },
  {
    slug: 'transboundary',
    group: 'status',
    nameJa: '国境を越える遺産',
    nameEn: 'Transboundary Heritage',
    descriptionJa: '複数の国が共同で守る世界遺産',
    transboundary: true,
  },
];
