import { expect, test } from '@playwright/test';
import { copy } from '../../src/content/copy';
import { openAs, resetEmulators, seedSession, SLIDE } from './helpers';

const { tools } = copy;
const allItems = tools.groups.flatMap((group) => group.items);

test('tools page renders without sign-in and without Firestore traffic', async ({ page }) => {
  const backendRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('127.0.0.1:8080') || req.url().includes('127.0.0.1:9099')) backendRequests.push(req.url());
  });
  await page.goto('#/tools');
  await expect(page.getByRole('heading', { level: 1, name: tools.title })).toBeVisible();
  await expect(page.getByText(tools.intro)).toBeVisible();
  await expect(page.getByRole('button', { name: /登入/ })).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(backendRequests).toEqual([]);
});

test('tools page shows the install blocks and every group in order', async ({ page }) => {
  await page.goto('#/tools');
  const howTo = page.getByTestId('tools-howto');
  await expect(howTo).toHaveCount(tools.howTo.length);
  for (const [i, block] of tools.howTo.entries()) {
    await expect(howTo.nth(i).getByRole('heading', { level: 2, name: block.heading })).toBeVisible();
    for (const line of block.body) await expect(howTo.nth(i).getByText(line, { exact: true })).toBeVisible();
  }
  const groups = page.getByTestId('tools-group');
  await expect(groups).toHaveCount(tools.groups.length);
  for (const [i, group] of tools.groups.entries()) {
    await expect(groups.nth(i).getByRole('heading', { level: 2, name: group.heading })).toBeVisible();
    const items = groups.nth(i).getByTestId('tool-item');
    await expect(items).toHaveCount(group.items.length);
    for (const [j, item] of group.items.entries()) {
      await expect(items.nth(j).getByRole('heading', { level: 3, name: item.name })).toBeVisible();
      await expect(items.nth(j).getByText(item.what, { exact: true })).toBeVisible();
    }
  }
});

test('a source with a URL is a safe link showing the URL, an empty one shows its label as plain text', async ({ page }) => {
  await page.goto('#/tools');
  let withSource = 0;
  let withoutSource = 0;
  for (const item of allItems) {
    const entry = page.getByTestId('tool-item').filter({ has: page.getByRole('heading', { name: item.name }) });
    const source = entry.getByTestId('tool-source');
    if (item.source !== '') {
      withSource += 1;
      const link = source.getByRole('link', { name: item.source, exact: true });
      await expect(link).toHaveAttribute('href', item.source);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveText(item.source);
    } else {
      withoutSource += 1;
      await expect(source).toHaveText(item.sourceLabel);
      await expect(source.locator('a')).toHaveCount(0);
    }
  }
  expect(withSource).toBeGreaterThan(0);
  expect(withoutSource).toBeGreaterThan(0);
});

test('tools page fits 640 px and 320 px without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto('#/tools');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.setViewportSize({ width: 320, height: 800 });
  const narrowOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(narrowOverflow).toBe(false);
});

test('next-steps slide links to the tools page in a new tab', async ({ browser, baseURL }) => {
  await resetEmulators();
  await seedSession(SLIDE.nextSteps);
  const { context, page } = await openAs(browser, baseURL, 'alice.wu@gcaa.org.tw', '#/');
  const link = page.getByRole('link', { name: tools.linkLabel, exact: true });
  await expect(link).toHaveAttribute('href', '#/tools');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
  await expect(popup.getByRole('heading', { level: 1, name: tools.title })).toBeVisible();
  await context.close();
});
