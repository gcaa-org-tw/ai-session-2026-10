import { expect, test } from '@playwright/test';
import { copy } from '../../src/content/copy';
import { openAs, resetEmulators, seedDoc, seedSession, SLIDE } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

test('a malformed entry document shows the load-failure screen with a reload button, not a blank page', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.wishlist);
  await seedDoc('entries/wishlist/users/broken', { items: 'not a list' });
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/');
  const boundary = page.getByTestId('error-boundary');
  await expect(boundary).toBeVisible();
  await expect(boundary.getByText(copy.states.loadError, { exact: true })).toBeVisible();
  const reload = boundary.getByRole('button', { name: copy.states.reload });
  await expect(reload).toBeEnabled();
  await Promise.all([page.waitForEvent('load'), reload.click()]);
  await context.close();
});
