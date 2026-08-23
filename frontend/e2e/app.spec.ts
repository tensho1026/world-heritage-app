import { expect, test, type Page } from '@playwright/test'

const heritage = {
  uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
  unescoId: '208',
  nameEn: 'Cultural Landscape and Archaeological Remains of the Bamiyan Valley',
  shortDescriptionEn: 'The Bamiyan Valley contains important historic remains.',
  descriptionEn:
    'The cultural landscape and archaeological remains represent artistic developments in the region.',
  justificationEn:
    'The site bears exceptional testimony to cultural traditions.',
  dateInscribed: 2003,
  danger: true,
  dangerList: '2003-present',
  areaHectares: 158.9,
  culturalCriteria: ['c1', 'c2'],
  naturalCriteria: [],
  criteriaText: '(i)(ii)',
  category: 'Cultural',
  statesNames: ['Afghanistan'],
  isoCodes: ['af'],
  region: 'Asia and the Pacific',
  latitude: 34.84694,
  longitude: 67.82525,
  mainImageUrl: null,
  mainImageAuthor: null,
  mainImageCopyright: null,
  mainImageCaptionEn: null,
  mainImageSourceUrl: null,
  mainImageLicense: null,
  imageUrls: [],
  mainVideoUrl: null,
  mainVideoAuthor: null,
  mainVideoCaptionEn: null,
  videoUrls: [],
  componentsCount: 8,
  isFeatured: true,
  wikipediaImageUrl: 'https://upload.wikimedia.org/bamiyan.jpg',
  wikipediaPageUrl: 'https://en.wikipedia.org/wiki/Bamyan_Valley',
  wikipediaImageAuthor: 'Example author',
  wikipediaImageLicense: 'CC BY-SA 4.0',
}

async function mockHomeApi(page: Page) {
  await page.route('**/api/stats', (route) =>
    route.fulfill({
      json: {
        totalViews: 0,
        totalReads: 0,
        uniqueViewed: 0,
        uniqueRead: 0,
        favorites: 0,
        readLater: 0,
        savedVocabulary: 0,
        memorizationVocabulary: 0,
        uncertainVocabulary: 0,
        comprehension: { difficult: 0, partial: 0, understood: 0 },
        byCategory: {},
        byRegion: {},
      },
    }),
  )
  await page.route('**/api/history', (route) => route.fulfill({ json: [] }))
}

test('shows the application heading and learning navigation', async ({
  page,
}) => {
  await mockHomeApi(page)
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: /世界遺産を探す旅を、\s*ここから。/,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '暗記', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('読んだ世界遺産')).toBeVisible()
})

test('renders a random heritage reader with learning actions', async ({
  page,
}) => {
  await page.route('**/api/heritage/random**', (route) =>
    route.fulfill({ json: heritage }),
  )
  await page.route('**/api/heritage/*/views', (route) =>
    route.fulfill({ json: { id: 1 } }),
  )
  await page.route('**/api/heritage/*/learning-state', (route) =>
    route.fulfill({
      json: {
        heritageSiteId: heritage.uuid,
        comprehensionLevel: null,
        isFavorite: false,
        isReadLater: false,
        readCount: 0,
      },
    }),
  )
  await page.goto('/random-heritage?mode=famous')

  await expect(
    page.getByRole('heading', { name: heritage.nameEn }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '日本語訳を表示' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '単語を記録する' }),
  ).toBeVisible()
  const aiLink = page.getByRole('link', { name: 'AIで全文翻訳 ↗' })
  await expect(aiLink).toHaveAttribute('href', /chatgpt\.com\/\?prompt=/)
})

test('advances memory cards with Enter', async ({ page }) => {
  await page.route('**/api/vocabulary?**', (route) =>
    route.fulfill({
      json: [
        {
          id: 1,
          expression: 'inscribed',
          normalizedExpression: 'inscribed',
          translationJa: '登録された',
          isInMemorization: true,
          isUncertain: true,
          createdAt: '2026-08-23T00:00:00.000Z',
          updatedAt: '2026-08-23T00:00:00.000Z',
          sources: [],
        },
        {
          id: 2,
          expression: 'outstanding universal value',
          normalizedExpression: 'outstanding universal value',
          translationJa: '顕著な普遍的価値',
          isInMemorization: true,
          isUncertain: true,
          createdAt: '2026-08-23T00:00:00.000Z',
          updatedAt: '2026-08-23T00:00:00.000Z',
          sources: [],
        },
      ],
    }),
  )
  await page.goto('/memorize')

  await expect(page.getByText('inscribed', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByText('登録された', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('outstanding universal value', { exact: true }),
  ).toBeVisible()
})
