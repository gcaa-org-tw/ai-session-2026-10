import { expect, test } from '@playwright/test';
import type { Browser, BrowserContext, Locator, Page } from '@playwright/test';
import { copy } from '../../src/content/copy';
import { openAs, PRESENTER, resetEmulators, seedSession, SLIDE } from './helpers';

const ALICE = 'alice.wu@gcaa.org.tw';
const SITE_PATTERN = 'https://six-cities.gcaa.org.tw/**';

test.beforeEach(async () => {
  await resetEmulators();
});

async function box(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element has no bounding box');
  return b;
}

async function openLiudu(browser: Browser, baseURL: string | undefined): Promise<{ context: BrowserContext; page: Page }> {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/0');
  await stubSite(page, []);
  await page.evaluate(() => {
    window.location.hash = '#/s/6/liudu';
  });
  return { context, page };
}

async function stubSite(page: Page, hits: string[]): Promise<void> {
  await page.route(SITE_PATTERN, async (route) => {
    hits.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub</title><p>stub</p>' });
  });
}

test('follower sees the static image next to the interactive site', async ({ browser, baseURL }) => {
  const { context, page } = await openLiudu(browser, baseURL);

  const image = page.getByRole('img', { name: copy.liudu.imageAlt });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

  const frame = page.locator('iframe');
  await expect(frame).toHaveAttribute('src', copy.liudu.siteUrl);
  await expect(frame).toHaveAttribute('title', copy.liudu.siteTitle);
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
  await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(frame).toHaveAttribute('loading', 'lazy');

  await expect(page.getByText(copy.liudu.staticLabel, { exact: true })).toBeVisible();
  await expect(page.getByText(copy.liudu.interactiveLabel, { exact: true })).toBeVisible();

  const open = page.getByRole('link', { name: copy.liudu.openSite });
  await expect(open).toHaveAttribute('href', copy.liudu.siteUrl);
  await expect(open).toHaveAttribute('target', '_blank');
  await expect(open).toHaveAttribute('rel', 'noopener noreferrer');

  const source = page.getByRole('link', { name: copy.liudu.imageSource });
  await expect(source).toHaveAttribute('href', copy.liudu.imageSourceUrl);
  await context.close();
});

test('panels sit side by side on a wide window and stack on a narrow one', async ({ browser, baseURL }) => {
  const { context, page } = await openLiudu(browser, baseURL);
  const image = page.getByRole('img', { name: copy.liudu.imageAlt });
  const frame = page.locator('iframe');
  await expect(frame).toBeVisible();

  await page.setViewportSize({ width: 1200, height: 800 });
  const wideImage = await box(image);
  const wideFrame = await box(frame);
  expect(wideFrame.x).toBeGreaterThan(wideImage.x + wideImage.width - 1);

  await page.setViewportSize({ width: 640, height: 800 });
  const narrowImage = await box(image);
  const narrowFrame = await box(frame);
  expect(narrowFrame.y).toBeGreaterThan(narrowImage.y + narrowImage.height - 1);
  await context.close();
});

test('no horizontal scroll at 640 px', async ({ browser, baseURL }) => {
  const { context, page } = await openLiudu(browser, baseURL);
  await page.setViewportSize({ width: 640, height: 800 });
  await expect(page.locator('iframe')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await context.close();
});

test('a failed image shows its alt text in a box', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/0');
  await stubSite(page, []);
  await page.route('**/liudu-static.png', (route) => route.abort());
  await page.evaluate(() => {
    window.location.hash = '#/s/6/liudu';
  });
  await expect(page.getByTestId('liudu-image-error')).toHaveText(copy.liudu.imageAlt);
  await expect(page.getByRole('img', { name: copy.liudu.imageAlt })).toHaveCount(0);
  await context.close();
});

test('presenter next-slide preview of liudu mounts no iframe and loads no site', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.scenario);
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const hits: string[] = [];
  await stubSite(presenter.page, hits);
  const next = presenter.page.getByTestId('presenter-next');
  await expect(next.locator('[data-slide-id="liudu"]')).toBeVisible();
  await expect(next.locator('iframe')).toHaveCount(0);
  await expect(presenter.page.locator('iframe')).toHaveCount(0);
  await presenter.page.waitForTimeout(500);
  expect(hits).toEqual([]);
  await presenter.context.close();
});
