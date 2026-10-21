import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { adminGetDoc, adminListIds, openAs, PRESENTER, resetEmulators, seedNotes, seedSession } from './helpers';

const HABITS_SLIDE = 3;

test.beforeEach(async () => {
  await resetEmulators();
});

function card(page: Page, name: string) {
  return page.getByRole('button', { name });
}

test('saves a habits entry, restores it after reload, and keeps one doc per user', async ({ browser, baseURL }) => {
  await seedSession(HABITS_SLIDE);
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(card(page, '自動摘要')).toBeVisible();
  await expect(page.getByTestId('save-status')).toHaveText('尚未填寫');

  await card(page, '自動摘要').click();
  await expect(page.getByTestId('save-status')).toHaveText('已儲存');

  await page.reload();
  await expect(card(page, '自動摘要')).toHaveAttribute('aria-pressed', 'true');

  await card(page, '查資料').click();
  await expect(page.getByTestId('save-status')).toHaveText('已儲存');
  await expect(card(page, '查資料')).toHaveAttribute('aria-pressed', 'true');

  const ids = await adminListIds('entries/habits/users');
  expect(ids).toHaveLength(1);
  const doc = await adminGetDoc(`entries/habits/users/${ids[0]}`);
  expect(doc).toEqual({ placements: { search: 'useful' } });
  await context.close();
});

test('shows 儲存失敗 offline, retry succeeds online, and no duplicate appears', async ({ browser, baseURL }) => {
  await seedSession(HABITS_SLIDE);
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(card(page, '自動摘要')).toBeVisible();
  await expect(page.getByTestId('save-status')).toHaveText('尚未填寫');

  await context.setOffline(true);
  await card(page, '自動摘要').click();
  await expect(page.getByTestId('save-status')).toHaveText('儲存中…');
  await expect(card(page, '自動摘要')).toBeDisabled();
  await expect(page.getByTestId('save-status')).toHaveText('儲存失敗', { timeout: 15000 });
  const retry = page.getByRole('button', { name: '重試' });
  await expect(retry).toBeVisible();

  await context.setOffline(false);
  await retry.click();
  await expect(page.getByTestId('save-status')).toHaveText('已儲存', { timeout: 30000 });

  const ids = await adminListIds('entries/habits/users');
  expect(ids).toHaveLength(1);
  expect(await adminGetDoc(`entries/habits/users/${ids[0]}`)).toEqual({ placements: { summary: 'useful' } });
  await context.close();
});

test('a follower arriving on an activity slide sees their saved entry', async ({ browser, baseURL }) => {
  await seedSession(HABITS_SLIDE);
  const first = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await card(first.page, '查資料').click();
  await expect(first.page.getByTestId('save-status')).toHaveText('已儲存');
  await first.context.close();

  const late = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(late.page.locator('[data-slide-id="habits"]')).toBeVisible();
  await expect(card(late.page, '查資料')).toHaveAttribute('aria-pressed', 'true');
  await expect(card(late.page, '自動摘要')).toHaveAttribute('aria-pressed', 'false');
  await late.context.close();

  const other = await openAs(browser, baseURL, 'b@gcaa.org.tw', '#/');
  await expect(card(other.page, '查資料')).toHaveAttribute('aria-pressed', 'false');
  await expect(other.page.getByTestId('save-status')).toHaveText('尚未填寫');
  await other.context.close();
});

test('presenter notes panel shows the note for the slide, or the empty state', async ({ browser, baseURL }) => {
  await seedNotes({ opening: '開場備忘' });
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const notes = page.getByTestId('notes-slot');
  await expect(notes).toContainText('開場備忘');
  await page.getByRole('button', { name: '下一張' }).click();
  await expect(notes).toContainText('這張沒有筆記');
  await context.close();
});

test('presenter notes panel shows the empty state when no notes were uploaded', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  await expect(page.getByTestId('notes-slot')).toContainText('這張沒有筆記');
  await context.close();
});
