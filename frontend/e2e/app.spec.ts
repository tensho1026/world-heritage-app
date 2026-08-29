import { expect, test, type Page } from '@playwright/test'

const heritage = {
  uuid: 'a1d7e93d-f865-53f4-a76b-0c7895273013',
  unescoId: '208',
  nameEn: 'Cultural Landscape and Archaeological Remains of the Bamiyan Valley',
  nameJa: 'バーミヤン渓谷の文化的景観と古代遺跡群',
  shortDescriptionEn: 'The Bamiyan Valley contains important historic remains.',
  shortDescriptionJa: 'バーミヤン渓谷には重要な歴史的遺構があります。',
  descriptionEn:
    'The cultural landscape and archaeological remains represent artistic developments in the region.',
  descriptionJa:
    'この文化的景観と考古遺跡は、この地域における芸術の発展を示しています。',
  justificationEn:
    'The site bears exceptional testimony to cultural traditions.',
  justificationJa: 'この遺産は文化的伝統を伝える顕著な証拠です。',
  dateInscribed: 2003,
  danger: true,
  dangerList: '2003-present',
  dangerListJa: '2003年から現在まで',
  areaHectares: 158.9,
  culturalCriteria: ['c1', 'c2'],
  naturalCriteria: [],
  criteriaText: '(i)(ii)',
  criteriaTextJa: '(i)(ii)',
  category: 'Cultural',
  statesNames: ['Afghanistan'],
  statesNamesJa: ['アフガニスタン'],
  isoCodes: ['af'],
  region: 'Asia and the Pacific',
  regionJa: 'アジア・太平洋',
  latitude: 34.84694,
  longitude: 67.82525,
  mainImageUrl: null,
  mainImageAuthor: null,
  mainImageCopyright: null,
  mainImageCaptionEn: null,
  mainImageCaptionJa: null,
  mainImageSourceUrl: null,
  mainImageLicense: null,
  imageUrls: [],
  mainVideoUrl: null,
  mainVideoAuthor: null,
  mainVideoCaptionEn: null,
  mainVideoCaptionJa: null,
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
  let deepLRequests = 0
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
  await page.route('**/api/translations/article/deepl', (route) => {
    deepLRequests += 1
    return route.fulfill({
      json: {
        nameEn: 'DeepLによるバーミヤン渓谷',
        shortDescriptionEn: 'DeepLで翻訳した概要です。',
      },
    })
  })
  await page.goto('/random-heritage?mode=famous')

  await expect(
    page.getByRole('heading', { name: heritage.nameEn }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '日本語訳を表示' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'DeepLで翻訳', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '単語を記録する' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '英文をハイライト' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'B1' })).toHaveCount(0)
  await page.getByRole('button', { name: '日本語訳を表示' }).click()
  await expect(page.getByText(heritage.nameJa)).toBeVisible()
  expect(deepLRequests).toBe(0)
  await page.getByRole('button', { name: '英語だけに戻す' }).click()
  await page.getByRole('button', { name: 'DeepLで翻訳', exact: true }).click()
  await expect(page.getByText('DeepLによるバーミヤン渓谷')).toBeVisible()
  expect(deepLRequests).toBe(1)
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
      json: {
        items: [
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
        total: 1,
        page: 1,
        pageSize: 24,
        totalPages: 1,
      },
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

test('browses an illustrated theme and opens a random matching site', async ({
  page,
}) => {
  await page.route('https://example.com/natural.jpg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"/>',
    }),
  )
  await page.route(/\/api\/discovery\/themes$/, (route) =>
    route.fulfill({
      json: [
        {
          slug: 'natural-heritage',
          group: 'category',
          nameJa: '自然遺産',
          nameEn: 'Natural Heritage',
          descriptionJa: '自然を守る世界遺産',
          count: 12,
          representativeUuid: heritage.uuid,
          mainImageUrl: 'https://example.com/natural.jpg',
        },
      ],
    }),
  )
  await page.route('**/api/discovery/filters', (route) =>
    route.fulfill({
      json: {
        regions: ['Asia and the Pacific'],
        countries: [],
        years: [],
        categories: ['Cultural', 'Natural', 'Mixed'],
        comprehensionLevels: ['difficult', 'partial', 'understood'],
      },
    }),
  )
  await page.route('**/api/discovery/sites**', (route) =>
    route.fulfill({
      json: {
        items: [{ ...heritage, readCount: 0 }],
        total: 1,
        page: 1,
        pageSize: 24,
        totalPages: 1,
      },
    }),
  )
  await page.route('**/api/discovery/random**', (route) =>
    route.fulfill({ json: { ...heritage, readCount: 0 } }),
  )

  await page.goto('/themes')
  await expect(
    page.getByRole('heading', { name: 'UNESCOの遺産区分から探す' }),
  ).toBeVisible()
  await expect(
    page.locator('img[src="https://example.com/natural.jpg"]'),
  ).toBeVisible()
  await page.getByRole('link', { name: /自然遺産/ }).click()
  await expect(page).toHaveURL(/theme=natural-heritage/)
  await page.getByLabel('地域').selectOption('Asia and the Pacific')
  await page.getByLabel('カテゴリー').selectOption('Natural')
  await page.getByRole('button', { name: 'この条件で探す' }).click()
  await expect(page).toHaveURL(/region=Asia/)
  await page.getByRole('button', { name: 'この条件からランダムに読む' }).click()
  await expect(page).toHaveURL(new RegExp(`/heritage/${heritage.uuid}$`))
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

test('shows country and regional reading progress on the map page', async ({
  page,
}) => {
  await page.route('**/api/discovery/filters', (route) =>
    route.fulfill({
      json: {
        regions: [],
        countries: [],
        years: [],
        categories: ['Cultural', 'Natural', 'Mixed'],
        comprehensionLevels: ['difficult', 'partial', 'understood'],
      },
    }),
  )
  await page.route('**/api/discovery/map**', (route) =>
    route.fulfill({ json: [] }),
  )
  await page.route('**/api/discovery/progress', (route) =>
    route.fulfill({
      json: {
        totalSites: 100,
        readSites: 42,
        totalCountries: 20,
        readCountries: 8,
        countries: [
          {
            name: 'Japan',
            isoCode: 'JP',
            total: 5,
            read: 2,
            percentage: 40,
            sites: [
              { uuid: heritage.uuid, nameEn: 'Himeji Castle', read: true },
            ],
          },
        ],
        regions: [
          {
            name: 'Asia and the Pacific',
            total: 30,
            read: 7,
            percentage: 23,
            sites: [],
          },
        ],
      },
    }),
  )
  await page.goto('/map')
  await expect(page.getByText('42 / 100')).toBeVisible()
  await expect(page.getByText('Asia and the Pacific')).toBeVisible()
  await page.getByLabel('国ごとの読了状況').selectOption('JP')
  await expect(page.getByRole('heading', { name: 'Japan' })).toBeVisible()
  await expect(page.getByText('Himeji Castle')).toBeVisible()
})

test('switches between historical and UNESCO timeline entries', async ({
  page,
}) => {
  await page.route('**/api/discovery/filters', (route) =>
    route.fulfill({
      json: {
        regions: [],
        countries: [],
        years: [],
        categories: ['Cultural', 'Natural', 'Mixed'],
        comprehensionLevels: ['difficult', 'partial', 'understood'],
      },
    }),
  )
  await page.route('**/api/discovery/timeline**', (route) =>
    route.fulfill({
      json: [
        {
          ...heritage,
          readCount: 0,
          historicalPeriods: [
            {
              start: -500,
              end: -401,
              label: '5th century BCE',
              type: 'construction',
              sourceUrl: 'https://whc.unesco.org/en/list/208',
              approximate: true,
              verified: true,
            },
            {
              start: 1200,
              end: 1250,
              label: '13th-century reconstruction',
              type: 'reconstruction',
              sourceUrl: 'https://whc.unesco.org/en/list/208',
              approximate: true,
              verified: true,
            },
          ],
        },
      ],
    }),
  )
  await page.goto('/timeline')
  await expect(page.getByText('5th century BCE')).toBeVisible()
  await expect(page.getByText('13th-century reconstruction')).toBeVisible()
  await page.getByRole('button', { name: 'UNESCO登録年' }).click()
  await expect(page.getByText('2003年登録')).toBeVisible()
})

test('creates a self-defined monthly challenge', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const created: Array<Record<string, unknown>> = []
  await page.route('**/api/discovery/filters', (route) =>
    route.fulfill({
      json: {
        regions: ['Asia and the Pacific'],
        countries: ['Japan'],
        years: [],
        categories: ['Cultural', 'Natural', 'Mixed'],
        comprehensionLevels: ['difficult', 'partial', 'understood'],
      },
    }),
  )
  await page.route('**/api/discovery/themes', (route) =>
    route.fulfill({ json: [] }),
  )
  await page.route(/\/api\/challenges(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      created.push({
        id: 1,
        ...body,
        progress: 0,
        percentage: 0,
        completed: false,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      return route.fulfill({ json: created[0] })
    }
    return route.fulfill({ json: created })
  })
  await page.goto('/challenges')
  expect(pageErrors).toEqual([])
  await expect(page.locator('body')).toContainText('今月の目標を、自分で決める')
  await page.getByLabel('チャレンジ名').fill('自然遺産を5件読む')
  await page.getByRole('button', { name: 'チャレンジを作成' }).click()
  await expect(
    page.getByRole('heading', { name: '自然遺産を5件読む' }),
  ).toBeVisible()
  await expect(page.getByText('達成まであと 5件')).toBeVisible()
})

test('answers a writing exercise from a heritage article', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
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
  await page.route(/\/api\/vocabulary(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  )
  await page.route('**/api/practice/attempts', (route) =>
    route.fulfill({ json: { id: 1 } }),
  )
  await page.goto('/random-heritage')
  expect(pageErrors).toEqual([])
  await expect(page.locator('body')).toContainText(heritage.nameEn)

  await page.getByRole('button', { name: /日本語から英文を組み立てる/ }).click()
  await expect(page.getByText(/バーミヤン渓谷/)).toBeVisible()
  await page
    .getByLabel('あなたの英文')
    .fill('The Bamiyan Valley contains important historic remains.')
  await page.getByRole('button', { name: '原文と比較' }).click()
  await expect(
    page.getByText('原文だけが唯一の正解表現ではありません。'),
  ).toBeVisible()
})
