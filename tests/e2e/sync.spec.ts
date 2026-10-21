import { expect, test } from '@playwright/test';
import { openAs, PRESENTER, resetEmulators } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

test('follower waits while no session exists', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(page.getByText('等待主持人開始')).toBeVisible();
  await context.close();
});

test('follower shows loading before the first snapshot, then the empty state', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(page.getByText('等待主持人開始')).toBeVisible();

  await context.route('**/google.firestore.v1.Firestore/Listen/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });
  await page.reload();
  await expect(page.getByTestId('session-loading')).toBeVisible();
  await expect(page.getByText('等待主持人開始')).toHaveCount(0);
  await expect(page.getByText('等待主持人開始')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('session-loading')).toHaveCount(0);
  await context.close();
});

test('presenter advances, follower follows, reload keeps state', async ({ browser, baseURL }) => {
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const current = presenter.page.getByTestId('presenter-current').locator('[data-slide-index]');
  await expect(current).toHaveAttribute('data-slide-index', '0');
  await expect(presenter.page.getByTestId('section-label')).not.toBeEmpty();
  await expect(presenter.page.getByTestId('notes-slot')).toBeVisible();

  const next = presenter.page.getByRole('button', { name: '下一張' });
  for (let i = 1; i <= 3; i++) {
    await next.click();
    await expect(current).toHaveAttribute('data-slide-index', String(i));
    await expect(next).toBeEnabled();
  }

  const follower = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(follower.page.locator('[data-slide-index]')).toHaveAttribute('data-slide-index', '3', { timeout: 2000 });

  await presenter.page.keyboard.press('ArrowRight');
  await expect(follower.page.locator('[data-slide-index]')).toHaveAttribute('data-slide-index', '4', { timeout: 2000 });
  await presenter.page.keyboard.press('ArrowLeft');
  await expect(follower.page.locator('[data-slide-index]')).toHaveAttribute('data-slide-index', '3', { timeout: 2000 });

  await presenter.page.reload();
  await expect(presenter.page.getByTestId('presenter-current').locator('[data-slide-index]')).toHaveAttribute('data-slide-index', '3');
  await expect(follower.page.locator('[data-slide-index]')).toHaveAttribute('data-slide-index', '3');

  await presenter.context.close();
  await follower.context.close();
});

test('follower stays usable at 640 px width', async ({ browser, baseURL }) => {
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  await expect(presenter.page.getByRole('button', { name: '下一張' })).toBeEnabled();
  const follower = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await follower.page.setViewportSize({ width: 640, height: 800 });
  const slide = follower.page.locator('[data-slide-index]');
  await expect(slide).toBeVisible();
  const overflow = await follower.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await presenter.context.close();
  await follower.context.close();
});
