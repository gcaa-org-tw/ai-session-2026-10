import { expect, test } from '@playwright/test';
import { copy } from '../../src/content/copy';

const DECK_STEP = copy.setup.steps.findIndex((step) => step.extra === 'deck');
const MEET_STEP = copy.setup.steps.findIndex((step) => step.extra === 'meet');

test('setup page renders without sign-in and without Firestore traffic', async ({ page }) => {
  const backendRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('127.0.0.1:8080') || req.url().includes('127.0.0.1:9099')) backendRequests.push(req.url());
  });
  await page.goto('#/setup');
  await expect(page.getByRole('heading', { level: 1, name: '分享會前的準備' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: '安裝 Antigravity' })).toBeVisible();
  await expect(page.getByRole('button', { name: /登入/ })).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(backendRequests).toEqual([]);
});

test('setup page lists five steps in order', async ({ page }) => {
  await page.goto('#/setup');
  const titles = page.getByTestId('setup-step-title');
  await expect(titles).toHaveText(['安裝 Antigravity', '登入 Antigravity', '資料使用設定', '開啟簡報', '加入 Google Meet']);
});

test('urls in step bodies become safe links', async ({ page }) => {
  await page.goto('#/setup');
  const download = page.locator('a[href="https://antigravity.google/download"]');
  await expect(download).toHaveCount(1);
  await expect(download).toHaveAttribute('target', '_blank');
  await expect(download).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('a[href="https://antigravity.google/terms"]')).toHaveCount(1);
  await expect(page.getByText('下載：')).toBeVisible();
});

test('deck link sits under the open-deck step', async ({ page }) => {
  expect(DECK_STEP).toBeGreaterThanOrEqual(0);
  await page.goto('#/setup');
  const link = page.getByTestId(`setup-step-${DECK_STEP}`).locator('a[href="https://gcaa-org-tw.github.io/ai-session-2026-10/"]');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('meet step shows the pending text while the link is empty', async ({ page }) => {
  expect(MEET_STEP).toBeGreaterThanOrEqual(0);
  await page.goto('#/setup');
  const step = page.getByTestId(`setup-step-${MEET_STEP}`);
  await expect(step).toContainText('會議連結會另外通知。');
  await expect(step.locator('a')).toHaveCount(0);
});

test('setup page fits 640 px without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto('#/setup');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test('setup page fits a 360 px phone width without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('#/setup');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
