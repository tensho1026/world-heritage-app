import { expect, test } from '@playwright/test'

test('shows the application heading', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '世界遺産を探す旅を、ここから。' }),
  ).toBeVisible()
})
