import { expect, test } from '@playwright/test';
import { copy } from '../../src/content/copy';
import { openAs, resetEmulators, seedSession, SLIDE } from './helpers';

const ALICE = 'alice.wu@gcaa.org.tw';
const COLUMNS = ['gave', 'context', 'did', 'mine'] as const;

test.beforeEach(async () => {
  await resetEmulators();
  await seedSession(SLIDE.workflows);
});

test('wide window shows one table with a header row and a row per workflow', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  await page.setViewportSize({ width: 1280, height: 900 });
  const table = page.getByTestId('workflows-table');
  await expect(table).toBeVisible();
  await expect(page.getByTestId('workflows-cards')).toBeHidden();
  const headers = table.getByRole('columnheader');
  await expect(headers).toHaveCount(5);
  await expect(headers.nth(0)).toHaveText('');
  for (const [i, column] of COLUMNS.entries()) await expect(headers.nth(i + 1)).toHaveText(copy.workflows.columns[column]);
  const rows = table.locator('tbody tr');
  await expect(rows).toHaveCount(copy.workflows.rows.length);
  for (const [i, row] of copy.workflows.rows.entries()) {
    await expect(rows.nth(i).getByRole('rowheader')).toHaveText(row.name);
    const cells = rows.nth(i).getByRole('cell');
    for (const [j, column] of COLUMNS.entries()) await expect(cells.nth(j)).toHaveText(row[column]);
  }
  await context.close();
});

test('narrow window stacks each workflow as a card and does not scroll sideways', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  await page.setViewportSize({ width: 640, height: 800 });
  const cards = page.getByTestId('workflows-cards');
  await expect(cards).toBeVisible();
  await expect(page.getByTestId('workflows-table')).toBeHidden();
  const items = cards.getByRole('listitem');
  await expect(items).toHaveCount(copy.workflows.rows.length);
  for (const [i, row] of copy.workflows.rows.entries()) {
    const card = items.nth(i);
    await expect(card.getByRole('heading', { name: row.name })).toBeVisible();
    for (const [j, column] of COLUMNS.entries()) {
      await expect(card.locator('dt').nth(j)).toHaveText(copy.workflows.columns[column]);
      await expect(card.locator('dd').nth(j)).toHaveText(row[column]);
    }
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await context.close();
});

test('the workflows slide reads no entries or private documents', async ({ browser, baseURL }) => {
  const traffic: string[] = [];
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  page.on('request', (r) => {
    if (r.url().includes('127.0.0.1:8080')) traffic.push(decodeURIComponent(r.url() + (r.postData() ?? '')));
  });
  await page.reload();
  await expect(page.locator('[data-slide-id="workflows"]')).toBeVisible();
  await page.waitForTimeout(500);
  expect(traffic.some((t) => t.includes('session/live'))).toBe(true);
  expect(traffic.some((t) => t.includes('entries') || t.includes('private'))).toBe(false);
  await context.close();
});
