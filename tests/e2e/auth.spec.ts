import { expect, test } from '@playwright/test';
import { PRESENTER_UID } from '../../src/lib/access';
import { ensureAccount, openAs, PRESENTER, resetEmulators } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

test('signed-out visitor sees the sign-in button', async ({ page }) => {
  await page.goto('#/');
  await expect(page.getByRole('button', { name: '用 gcaa.org.tw 帳號登入' })).toBeVisible();
});

test('personal gmail sees the denied screen with a switch button', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'x@gmail.com', '#/');
  await expect(page.getByTestId('denied-email')).toHaveText('x@gmail.com');
  await expect(page.getByRole('button', { name: '換一個帳號' })).toBeVisible();
  await page.getByRole('button', { name: '換一個帳號' }).click();
  await expect(page.getByRole('button', { name: '用 gcaa.org.tw 帳號登入' })).toBeVisible();
  await context.close();
});

test('gcaa colleague sees the follower view', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  await expect(page.getByText('等待主持人開始')).toBeVisible();
  await context.close();
});

test('gcaa colleague at the presenter route is turned away', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/presenter');
  await expect(page.getByText('此頁僅限主持人')).toBeVisible();
  await expect(page.getByRole('button', { name: '下一張' })).toHaveCount(0);
  await context.close();
});

test('presenter account reaches the presenter console', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  await expect(page.getByRole('button', { name: '下一張' })).toBeVisible();
  const uid = await page.evaluate(async () => {
    const token = await (window as unknown as { __e2eIdToken: () => Promise<string> }).__e2eIdToken();
    return (JSON.parse(atob(token.split('.')[1] ?? '')) as { user_id: string }).user_id;
  });
  expect(uid).toBe(PRESENTER_UID);
  await context.close();
});

test('an account with the presenter address under another uid is turned away', async ({ browser, baseURL }) => {
  await ensureAccount(PRESENTER, 'not-the-presenter');
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  await expect(page.getByText('此頁僅限主持人')).toBeVisible();
  await expect(page.getByRole('button', { name: '下一張' })).toHaveCount(0);
  await context.close();
});

test('unknown route shows a not-found page', async ({ page }) => {
  await page.goto('#/nowhere');
  await expect(page.getByText('找不到這個頁面')).toBeVisible();
});
