import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { copy } from '../../src/content/copy';
import { openAs, PRESENTER, resetEmulators, seedSession, SLIDE } from './helpers';

const ALICE = 'alice.wu@gcaa.org.tw';
const SECTIONS = [0, 1, 2, 3, 4, 5, 6] as const;
const JUMP = { name: '跳過去' };
const FOLLOW = { name: '自動跟著主持人' };
const SKIP = { name: '略過這個活動' };

test.beforeEach(async () => {
  await resetEmulators();
});

function block(page: Page, id: string): Locator {
  return page.locator(`#block-${id}`);
}

function toc(page: Page): Locator {
  return page.getByRole('navigation', { name: '目錄' });
}

async function blockTop(page: Page, id: string): Promise<number> {
  const box = await block(page, id).boundingBox();
  if (!box) throw new Error(`block ${id} has no bounding box`);
  return box.y;
}

async function expectAtTop(page: Page, id: string): Promise<void> {
  await expect(block(page, id)).toBeInViewport();
  await expect.poll(() => blockTop(page, id)).toBeGreaterThanOrEqual(-5);
  await expect.poll(() => blockTop(page, id)).toBeLessThan(200);
}

async function sectionHeading(page: Page, section: number): Promise<Locator> {
  const heading = page.getByRole('heading', { level: 1, name: copy.sections[section as 0] });
  await expect(heading).toBeVisible();
  return heading;
}

test('a live session at the habits slide lands on section 2 at that block, with the pill', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.habits);
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  await expect(page).toHaveURL(/#\/s\/2\/habits$/);
  await sectionHeading(page, 2);
  await expectAtTop(page, 'habits');

  const pill = page.getByTestId('presenter-pill');
  await expect(pill).toBeVisible();
  await expect(pill).toContainText(`主持人正在：${copy.slides.habits.title}`);
  await expect(pill.getByRole('button', JUMP)).toHaveCount(0);
  await expect(pill.getByRole('checkbox', FOLLOW)).not.toBeChecked();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(pill.getByRole('button', JUMP)).toBeVisible();
  await pill.getByRole('button', JUMP).click();
  await expectAtTop(page, 'habits');
  await expect(page).toHaveURL(/#\/s\/2\/habits$/);
  await expect(pill.getByRole('button', JUMP)).toHaveCount(0);
  await context.close();
});

test('the pill jump crosses into another section when the presenter is elsewhere', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.flowchart);
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/0');
  const pill = page.getByTestId('presenter-pill');
  await expect(pill).toContainText(`主持人正在：${copy.slides.flowchart.title}`);
  await pill.getByRole('button', JUMP).click();
  await expect(page).toHaveURL(/#\/s\/3\/flowchart$/);
  await expectAtTop(page, 'flowchart');
  await context.close();
});

test('the pill sits at the bottom of the contents sidebar on a wide window, never over the main column, and inside the top bar on a narrow one', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.habits);
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  const pill = page.getByTestId('presenter-pill');
  await expect(pill).toBeVisible();
  const sidebar = page.locator('aside').filter({ has: toc(page) });
  await expect(sidebar.getByTestId('presenter-pill')).toBeVisible();
  for (const width of [1024, 1180, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(pill).toBeVisible();
    const box = await pill.boundingBox();
    const side = await sidebar.boundingBox();
    const main = await page.locator('main').boundingBox();
    if (!box || !side || !main) throw new Error('missing geometry');
    expect(box.x, `x at ${width}`).toBeGreaterThanOrEqual(side.x);
    expect(box.x + box.width, `right edge at ${width}`).toBeLessThanOrEqual(side.x + side.width);
    expect(box.x + box.width, `clear of main at ${width}`).toBeLessThanOrEqual(main.x);
    expect(box.width, `fits content at ${width}`).toBeLessThan(side.width);
    expect(box.y + box.height, `bottom at ${width}`).toBeGreaterThan(800 - 80);
    await page.evaluate(() => window.scrollTo(0, 900));
    const scrolled = await pill.boundingBox();
    expect(scrolled?.y).toBe(box.y);
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  await page.setViewportSize({ width: 640, height: 800 });
  await expect(pill).toBeVisible();
  const narrow = await pill.boundingBox();
  if (!narrow) throw new Error('missing geometry');
  expect(narrow.y).toBeLessThan(120);
  await page.evaluate(() => window.scrollTo(0, 600));
  const scrolled = await pill.boundingBox();
  expect(scrolled?.y).toBeLessThan(120);
  await context.close();
});

test('auto-follow moves the follower as the presenter advances, across sections, and is remembered', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.habits);
  const follower = await openAs(browser, baseURL, ALICE, '#/');
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const checkbox = follower.page.getByRole('checkbox', FOLLOW);
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  expect(await follower.page.evaluate(() => window.localStorage.getItem('follow-presenter'))).toBe('true');
  const historyLength = await follower.page.evaluate(() => window.history.length);

  const next = presenter.page.getByRole('button', { name: '下一張' });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(follower.page).toHaveURL(/#\/s\/2\/principles$/);
  await expectAtTop(follower.page, 'principles');

  await expect(next).toBeEnabled();
  await next.click();
  await expect(follower.page).toHaveURL(/#\/s\/3\/chat-vs-agent$/);
  await sectionHeading(follower.page, 3);
  await expectAtTop(follower.page, 'chat-vs-agent');
  expect(await follower.page.evaluate(() => window.history.length)).toBe(historyLength);

  await follower.page.reload();
  await expect(follower.page.getByRole('checkbox', FOLLOW)).toBeChecked();
  await checkbox.uncheck();
  expect(await follower.page.evaluate(() => window.localStorage.getItem('follow-presenter'))).toBe('false');

  await presenter.context.close();
  await follower.context.close();
});

test('the table of contents jumps between sections and blocks on a wide window', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/2');
  await sectionHeading(page, 2);
  await expect(toc(page).getByRole('link', { name: copy.slides.habits.title })).toBeVisible();
  await expect(toc(page).getByRole('link', { name: copy.slides.logic.title })).toHaveCount(0);

  await toc(page).getByRole('link', { name: copy.sections[3], exact: true }).click();
  await expect(page).toHaveURL(/#\/s\/3$/);
  await sectionHeading(page, 3);
  await expect(toc(page).getByRole('link', { name: copy.slides.habits.title })).toHaveCount(0);

  await toc(page).getByRole('link', { name: copy.slides.workflows.title }).click();
  await expect(page).toHaveURL(/#\/s\/3\/workflows$/);
  await expectAtTop(page, 'workflows');
  await expect(toc(page).getByRole('link', { name: copy.slides.workflows.title })).toHaveAttribute('aria-current', 'location');

  await toc(page).getByRole('link', { name: copy.slides.logic.title }).click();
  await expectAtTop(page, 'logic');
  await expect(toc(page).getByRole('link', { name: copy.slides.logic.title })).toHaveAttribute('aria-current', 'location');

  await page.goBack();
  await sectionHeading(page, 2);
  await context.close();
});

test('the table of contents sheet opens from the top bar on a narrow window', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/2');
  await page.setViewportSize({ width: 640, height: 900 });
  await sectionHeading(page, 2);
  const opener = page.getByRole('button', { name: '目錄' });
  const dialog = page.getByRole('dialog', { name: '目錄' });
  await expect(toc(page)).toHaveCount(0);

  await opener.click();
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement))).toBe(true);
  }
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement))).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  await page.getByTestId('toc-backdrop').click({ position: { x: 600, y: 400 } });
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  await dialog.getByRole('link', { name: copy.sections[5], exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#\/s\/5$/);
  await sectionHeading(page, 5);

  await opener.click();
  await dialog.getByRole('link', { name: copy.slides['race-intro'].title }).click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page).toHaveURL(/#\/s\/5\/race-intro$/);
  await expectAtTop(page, 'race-intro');
  await context.close();
});

test('the skip control moves past an activity and the last activity of a section points at the next section', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.habits);
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  await expectAtTop(page, 'habits');
  await block(page, 'habits').getByRole('button', SKIP).click();
  await expect(page).toHaveURL(/#\/s\/2\/principles$/);
  await expectAtTop(page, 'principles');
  await expect(block(page, 'principles').getByRole('button', SKIP)).toHaveCount(0);

  await page.goto('#/s/1');
  await sectionHeading(page, 1);
  await block(page, 'warmup').getByRole('button', SKIP).click();
  const next = page.getByRole('link', { name: `下一段：${copy.sections[2]}` });
  await expect(next).toBeInViewport();
  await next.click();
  await expect(page).toHaveURL(/#\/s\/2$/);
  await sectionHeading(page, 2);

  await page.goto('#/s/5');
  await expect(page.getByRole('button', SKIP)).toHaveCount(3);
  await context.close();
});

test('reload keeps the section and the block, including after scrolling', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/3/demo-plan');
  await sectionHeading(page, 3);
  await expectAtTop(page, 'demo-plan');
  await page.reload();
  await expect(page).toHaveURL(/#\/s\/3\/demo-plan$/);
  await expectAtTop(page, 'demo-plan');

  await page.mouse.wheel(0, 1600);
  await expect(page).toHaveURL(/#\/s\/3\/(?!demo-plan$)[a-z-]+$/);
  const hash = await page.evaluate(() => window.location.hash);
  const id = hash.split('/').pop() ?? '';
  await page.reload();
  expect(await page.evaluate(() => window.location.hash)).toBe(hash);
  await expectAtTop(page, id);
  await context.close();
});

test('footers link to the neighbouring sections', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/0');
  await sectionHeading(page, 0);
  await expect(page.getByRole('link', { name: /^上一段：/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: `下一段：${copy.sections[1]}` })).toBeVisible();

  await page.goto('#/s/6');
  await sectionHeading(page, 6);
  await expect(page.getByRole('link', { name: /^下一段：/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: `上一段：${copy.sections[5]}` })).toBeVisible();

  await page.goto('#/s/2');
  await sectionHeading(page, 2);
  await expect(page.getByRole('link', { name: `上一段：${copy.sections[1]}` })).toBeVisible();
  await page.getByRole('link', { name: `下一段：${copy.sections[3]}` }).click();
  await expect(page).toHaveURL(/#\/s\/3$/);
  await sectionHeading(page, 3);
  await context.close();
});

test('the section title sets one character per grid cell, runs on as empty cells to the column edge, and animates once, unless motion is reduced', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/3');
  const heading = await sectionHeading(page, 3);
  const cells = heading.locator('.cell-settle');
  await expect(cells).toHaveCount(Array.from(copy.sections[3]).length);
  await expect(heading.locator('span:not([aria-hidden="true"])')).toHaveCount(0);
  const sizes = await cells.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  for (const width of sizes) expect(width).toBeCloseTo(56, 0);
  const fill = heading.locator('.title-fill');
  const lastCell = await cells.last().boundingBox();
  const strip = await fill.boundingBox();
  const box = await heading.boundingBox();
  if (!lastCell || !strip || !box) throw new Error('missing geometry');
  expect(strip.x).toBeLessThanOrEqual(lastCell.x + lastCell.width);
  expect(strip.x + strip.width).toBeCloseTo(box.x + box.width, 0);
  expect(box.width).toBeCloseTo(640, 0);
  expect(strip.height).toBeCloseTo(56, 0);
  const motion = await cells.evaluateAll((els) =>
    els.map((el) => {
      const style = getComputedStyle(el);
      return { name: style.animationName, delay: style.animationDelay, duration: style.animationDuration };
    }),
  );
  expect(motion.map((m) => m.name)).toEqual(motion.map(() => 'cell-settle'));
  expect(motion.map((m) => m.delay)).toEqual(['0s', '0.045s', '0.09s', '0.135s', '0.18s', '0.225s']);
  expect(motion[0]?.duration).toBe('0.26s');
  expect(await fill.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');

  await page.setViewportSize({ width: 500, height: 800 });
  const narrow = await cells.first().evaluate((el) => el.getBoundingClientRect().width);
  expect(narrow).toBeCloseTo(40, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/s/4');
  await sectionHeading(page, 4);
  const reduced = await page.getByRole('heading', { level: 1 }).locator('span').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(reduced).toBe('none');
  await context.close();
});

test('unknown section shows not-found and an unknown block opens the section top', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/9');
  await expect(page.getByText('找不到這個頁面')).toBeVisible();
  await page.goto('#/s/2/nope');
  await sectionHeading(page, 2);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await context.close();
});

test('every section page fits 640 px without horizontal scroll', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/s/0');
  await page.setViewportSize({ width: 640, height: 900 });
  for (const section of SECTIONS) {
    await page.goto(`#/s/${section}`);
    await sectionHeading(page, section);
    await expect(page.locator('[data-slide-id]').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `section ${section}`).toBeLessThanOrEqual(0);
  }
  await context.close();
});
