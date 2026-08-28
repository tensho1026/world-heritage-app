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
  await page.route('**/api/vocabulary/review/summary', (route) =>
    route.fulfill({
      json: { dueToday: 2, reviewedToday: 0, upcomingWeek: 1 },
    }),
  )
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
  await page.route('**/api/highlights/site/**', (route) =>
    route.fulfill({ json: [] }),
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
  await expect(
    page.getByRole('button', { name: '英文をハイライト' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'B1', exact: true }).click()
  await expect(
    page.getByText(/アプリ内の語彙置換による学習用参考文/),
  ).toBeVisible()
  await page.getByRole('button', { name: /一文ずつ聞いて声に出す/ }).click()
  await expect(page.getByRole('button', { name: '● 録音を開始' })).toBeVisible()
  const aiLink = page.getByRole('link', { name: 'AIで全文翻訳 ↗' })
  await expect(aiLink).toHaveAttribute('href', /chatgpt\.com\/\?prompt=/)
})

test('saves and restores a sentence highlight with a note', async ({
  page,
}) => {
  const savedHighlights: Array<Record<string, unknown>> = []
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
  await page.route('**/api/highlights/site/**', (route) =>
    route.fulfill({ json: savedHighlights }),
  )
  await page.route('**/api/highlights', async (route) => {
    const body = route.request().postDataJSON()
    const saved = {
      id: 1,
      ...body,
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
    }
    savedHighlights.push(saved)
    await route.fulfill({ json: saved })
  })
  await page.goto('/random-heritage')
  await page.getByRole('button', { name: '英文をハイライト' }).click()
  const paragraph = page.locator('[data-highlight-section="description-0"]')
  await paragraph.selectText()
  await paragraph.dispatchEvent('mouseup')
  await expect(page.getByText('HIGHLIGHT & NOTE')).toBeVisible()
  await page.getByLabel('日本語メモ').fill('主語と修飾関係を後で確認する')
  await page.getByRole('button', { name: '黄色でハイライト保存' }).click()
  await expect(page.locator('mark[data-highlight-id="1"]')).toBeVisible()

  await page.reload()
  await expect(page.locator('mark[data-highlight-id="1"]')).toBeVisible()
  await expect(page.getByText('主語と修飾関係を後で確認する')).toBeVisible()
})

test('advances spaced-repetition cards with Enter', async ({ page }) => {
  const reviewedIds = new Set<number>()
  const cards = [
    {
      id: 1,
      expression: 'inscribed',
      normalizedExpression: 'inscribed',
      translationJa: '登録された',
      isInMemorization: true,
      isUncertain: true,
      nextReviewAt: '2026-08-23T00:00:00.000Z',
      reviewIntervalDays: 0,
      reviewEaseFactor: 2.5,
      reviewCount: 0,
      lapseCount: 0,
      lastReviewedAt: null,
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
      nextReviewAt: '2026-08-23T00:00:00.000Z',
      reviewIntervalDays: 0,
      reviewEaseFactor: 2.5,
      reviewCount: 0,
      lapseCount: 0,
      lastReviewedAt: null,
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
      sources: [],
    },
  ]
  await page.route('**/api/vocabulary/review/due', (route) =>
    route.fulfill({
      json: cards.filter((card) => !reviewedIds.has(card.id)),
    }),
  )
  await page.route('**/api/vocabulary/review/summary', (route) =>
    route.fulfill({ json: { dueToday: 2, reviewedToday: 0, upcomingWeek: 0 } }),
  )
  await page.route('**/api/vocabulary/*/reviews', async (route) => {
    const id = Number(
      route
        .request()
        .url()
        .match(/vocabulary\/(\d+)/)?.[1],
    )
    reviewedIds.add(id)
    await route.fulfill({ json: cards.find((card) => card.id === id) })
  })
  await page.goto('/memorize')

  await expect(page.getByText('inscribed', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByText('登録された', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('outstanding universal value', { exact: true }),
  ).toBeVisible()
})

test('searches World Heritage sites with combined filters', async ({
  page,
}) => {
  await page.route('**/api/discovery/filters', (route) =>
    route.fulfill({
      json: {
        regions: ['Europe and North America'],
        countries: ['France'],
        years: [1979],
        categories: ['Cultural', 'Natural', 'Mixed'],
        comprehensionLevels: ['difficult', 'partial', 'understood'],
      },
    }),
  )
  await page.route('**/api/discovery/sites**', (route) =>
    route.fulfill({
      json: [
        {
          uuid: heritage.uuid,
          nameEn: 'Palace and Park of Versailles',
          shortDescriptionEn: 'A royal residence.',
          statesNames: ['France'],
          region: 'Europe and North America',
          category: 'Cultural',
          dateInscribed: 1979,
          latitude: 48.8,
          longitude: 2.1,
          isFeatured: true,
          mainImageUrl: null,
          comprehensionLevel: null,
          isFavorite: false,
          isReadLater: false,
          readCount: 0,
        },
      ],
    }),
  )
  await page.goto('/explore')
  await expect(
    page.getByRole('heading', { name: '世界遺産を探す' }),
  ).toBeVisible()
  await page.getByLabel('国').selectOption('France')
  await page.getByLabel('カテゴリー').selectOption('Cultural')
  await page.getByRole('button', { name: 'この条件で探す' }).click()
  await expect(page.getByText('Palace and Park of Versailles')).toBeVisible()
})

test('shows learning calendar and weekly report', async ({ page }) => {
  await mockHomeApi(page)
  await page.route('**/api/reports/calendar**', (route) =>
    route.fulfill({
      json: {
        month: '2026-08',
        days: {
          '2026-08-23': { reads: 1, savedVocabulary: 2, reviews: 3, total: 6 },
        },
        activeDays: 1,
        currentStreak: 1,
      },
    }),
  )
  await page.route('**/api/reports/weekly', (route) =>
    route.fulfill({
      json: {
        generatedAt: '2026-08-23T00:00:00.000Z',
        periodStart: '2026-08-17T00:00:00.000Z',
        periodEnd: '2026-08-23T00:00:00.000Z',
        readSites: [],
        newVocabulary: [],
        difficultVocabulary: [],
        comprehensionChanges: [],
        nextWeekReviewCount: 4,
        reviewCount: 3,
        quizAttempts: 1,
        quizAccuracy: 80,
      },
    }),
  )
  await page.goto('/stats')
  await expect(
    page.getByRole('heading', { name: '学習カレンダー' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '今週の振り返り' }),
  ).toBeVisible()
  await expect(page.getByText(/来週までに復習予定の単語は/)).toContainText(
    '4件',
  )
})
