import { expect, test } from '@playwright/test'

test('onboarding, home, starting a lesson, and navigation', async ({ page }) => {
  await page.goto('/')
  // new users land on the welcome flow
  await expect(page.getByRole('heading', { name: 'Болгарский с нуля' })).toBeVisible()
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByRole('button', { name: 'Поехали!' }).click()

  // home: daily quests and the first lesson of the course
  await expect(page.getByRole('heading', { name: 'Задания дня' })).toBeVisible()
  await page.getByRole('button', { name: /Артикль и прилагательное/ }).click()
  await expect(page.getByText('Артикль присоединяется к первому слову').first()).toBeVisible()
  await page.getByRole('button', { name: 'Начать урок' }).click()

  // an exercise is shown with a progress bar and a disabled check button
  await expect(page.getByRole('progressbar')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Проверить' })).toBeDisabled()
  await page.getByRole('button', { name: 'Закрыть урок' }).click({ trial: true })

  // progress persists across reload (local storage)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Задания дня' })).toBeVisible()
  await page.getByRole('link', { name: 'Профиль' }).click()
  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
})
