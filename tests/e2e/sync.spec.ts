import { expect, test } from '@playwright/test';
import { copy } from '../../src/content/copy';
import { openAs, PRESENTER, resetEmulators, seedSession, SLIDE } from './helpers';

const FOLLOW = { name: '自動跟著主持人' };

test.beforeEach(async () => {
  await resetEmulators();
});

test('follower lands on section 0 while no session exists, with no presenter pill', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(page).toHaveURL(/#\/s\/0$/);
  await expect(page.getByRole('heading', { level: 1, name: copy.sections[0] })).toBeVisible();
  await expect(page.locator('#block-opening')).toBeVisible();
  await expect(page.getByTestId('presenter-pill')).toHaveCount(0);
  await context.close();
});

test('follower shows loading before the first snapshot, then lands on section 0', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(page).toHaveURL(/#\/s\/0$/);

  await context.route('**/google.firestore.v1.Firestore/Listen/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });
  await page.goto(baseURL ?? '/');
  await expect(page.getByTestId('session-loading')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: copy.sections[0] })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: copy.sections[0] })).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/#\/s\/0$/);
  await expect(page.getByTestId('session-loading')).toHaveCount(0);
  await context.close();
});

test('presenter advances, follower pill tracks it, reload keeps state', async ({ browser, baseURL }) => {
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
  const pill = follower.page.getByTestId('presenter-pill-text');
  await expect(follower.page).toHaveURL(/#\/s\/2\/habits$/);
  await expect(pill).toHaveText(`主持人正在：${copy.slides.habits.title}`, { timeout: 2000 });

  await presenter.page.keyboard.press('ArrowRight');
  await expect(pill).toHaveText(`主持人正在：${copy.slides.principles.title}`, { timeout: 2000 });
  await presenter.page.keyboard.press('ArrowLeft');
  await expect(pill).toHaveText(`主持人正在：${copy.slides.habits.title}`, { timeout: 2000 });

  await presenter.page.reload();
  await expect(presenter.page.getByTestId('presenter-current').locator('[data-slide-index]')).toHaveAttribute('data-slide-index', '3');
  await expect(pill).toHaveText(`主持人正在：${copy.slides.habits.title}`);

  await presenter.context.close();
  await follower.context.close();
});

test('presenter progress never moves the follower unless auto-follow is on', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.habits);
  const follower = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(follower.page).toHaveURL(/#\/s\/2\/habits$/);
  await expect(follower.page.getByRole('checkbox', FOLLOW)).not.toBeChecked();
  const before = await follower.page.evaluate(() => window.scrollY);
  await seedSession(SLIDE.habits + 1);
  await expect(follower.page.getByTestId('presenter-pill-text')).toHaveText(`主持人正在：${copy.slides.principles.title}`);
  await follower.page.waitForTimeout(500);
  expect(await follower.page.evaluate(() => window.scrollY)).toBe(before);
  await expect(follower.page).toHaveURL(/#\/s\/2\/habits$/);
  await follower.context.close();
});

test('follower stays usable at 640 px width', async ({ browser, baseURL }) => {
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  await expect(presenter.page.getByRole('button', { name: '下一張' })).toBeEnabled();
  const follower = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await follower.page.setViewportSize({ width: 640, height: 800 });
  await expect(follower.page.locator('[data-slide-id]').first()).toBeVisible();
  await expect(follower.page.getByRole('button', { name: '目錄' })).toBeVisible();
  const overflow = await follower.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await presenter.context.close();
  await follower.context.close();
});
