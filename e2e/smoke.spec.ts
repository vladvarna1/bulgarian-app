import { expect, test } from '@playwright/test'

test('home loads and navigation works', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Болгарский с нуля' })).toBeVisible()
  await page.getByRole('link', { name: 'Профиль' }).click()
  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
})
