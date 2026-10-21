import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { copy } from '../../src/content/copy';
import { adminGetDoc, adminListIds, openAs, PRESENTER, resetEmulators, seedSession, SLIDE } from './helpers';

const ALICE = 'alice.wu@gcaa.org.tw';
const BOB = 'bob.lin@gcaa.org.tw';

test.beforeEach(async () => {
  await resetEmulators();
});

function habit(page: Page, id: string) {
  return page.getByTestId(`habit-${id}`);
}

async function place(page: Page, id: string, bin: string) {
  await habit(page, id).getByRole('button', { name: bin, exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('已儲存');
}

async function fillWish(page: Page, slot: number, text: string, checks: string[]) {
  const item = page.getByTestId(`wish-item-${slot}`);
  await item.getByRole('textbox').fill(text);
  for (const label of checks) await item.getByRole('checkbox', { name: label }).check();
}

const Q = {
  repeats: '這件事會重複發生嗎？',
  rulesWritable: '做法能寫成明確的步驟或規則嗎？',
  sourceCheckable: '做完的結果，有來源可以驗證嗎？',
};
const OPT_IN = '留名，方便後續協助';

test('two users place habit cards, presenter reveals, both see the room split and example', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.habits);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const b = await openAs(browser, baseURL, BOB, '#/');
  await expect(habit(a.page, 'h1')).toBeVisible();
  await expect(habit(b.page, 'h1')).toBeVisible();

  await place(a.page, 'h1', '過時');
  await place(a.page, 'h7', '仍然有用');
  await place(b.page, 'h1', '過時');
  await place(b.page, 'h7', '新習慣');

  await expect(a.page.getByTestId('split-outdated')).toHaveCount(0);
  await expect(a.page.getByText('建議分類')).toHaveCount(0);
  await expect(a.page.getByText('寫拜會說帖前先指定角色')).toHaveCount(0);
  await expect(a.page.getByRole('button', { name: '揭曉' })).toHaveCount(0);

  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const reveal = presenter.page.getByTestId('presenter-current').getByRole('button', { name: '揭曉' });
  await expect(reveal).toBeEnabled();
  await reveal.click();

  for (const page of [a.page, b.page, presenter.page]) {
    await expect(habit(page, 'h1').getByTestId('split-outdated')).toContainText('2');
    await expect(habit(page, 'h1').getByTestId('split-useful')).toContainText('0');
    await expect(habit(page, 'h7').getByTestId('split-useful')).toContainText('1');
    await expect(habit(page, 'h7').getByTestId('split-new')).toContainText('1');
    await expect(habit(page, 'h1').getByText('寫拜會說帖前先指定角色')).toBeVisible();
    await expect(habit(page, 'h1').getByText('建議分類')).toBeVisible();
    await expect(habit(page, 'h1').getByTestId('split-outdated').getByText('建議分類')).toBeVisible();
    await expect(habit(page, 'h1').getByTestId('split-useful').getByText('建議分類')).toHaveCount(0);
  }
  await expect(presenter.page.getByRole('button', { name: '揭曉' })).toHaveCount(0);

  expect(await adminListIds('entries/habits/users')).toHaveLength(2);
  await a.context.close();
  await b.context.close();
  await presenter.context.close();
});

test('presenter reveal control is not shown to participants', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.habits);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(habit(a.page, 'h1')).toBeVisible();
  await expect(a.page.getByRole('button', { name: '揭曉' })).toHaveCount(0);
  await a.context.close();
});

test('wishlist item with all yes lands in 請人協助建置 live, and the board never shows names or emails', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.wishlist);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const b = await openAs(browser, baseURL, BOB, '#/');
  const board = b.page.getByTestId('wish-board');
  await expect(board).toContainText('還沒有人填寫');

  await fillWish(a.page, 0, '整理公聽會逐字稿', [Q.repeats, Q.rulesWritable, Q.sourceCheckable, OPT_IN]);
  await expect(a.page.getByTestId('wish-bin-0')).toHaveText('請人協助建置');
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');

  await fillWish(a.page, 1, '寫一次性的感謝信', [Q.rulesWritable, Q.sourceCheckable]);
  await expect(a.page.getByTestId('wish-bin-1')).toHaveText('現在就能做');
  await fillWish(a.page, 2, '猜測選情', [Q.repeats]);
  await expect(a.page.getByTestId('wish-bin-2')).toHaveText('你可以學');

  await expect(board.getByTestId('wish-group-build')).toContainText('整理公聽會逐字稿');
  await expect(board.getByTestId('wish-group-now')).toContainText('寫一次性的感謝信');
  await expect(board.getByTestId('wish-group-learn')).toContainText('猜測選情');
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');

  for (const page of [a.page, b.page]) {
    const text = (await page.getByTestId('wish-board').innerText()).toLowerCase();
    for (const forbidden of ['alice', 'bob', '@gcaa', 'wu', 'lin']) expect(text).not.toContain(forbidden);
  }
  const names = await adminGetDoc(`names/${(await adminListIds('names'))[0]}`);
  expect(names).toEqual({ displayName: 'alice.wu' });
  expect(await adminListIds('entries/wishlist/users')).toHaveLength(1);
  await a.context.close();
  await b.context.close();
});

test('presenter export starts with a BOM and names only the opted-in item', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.wishlist);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const b = await openAs(browser, baseURL, BOB, '#/');
  await fillWish(a.page, 0, '整理公聽會逐字稿', [Q.repeats, Q.rulesWritable, Q.sourceCheckable, OPT_IN]);
  await fillWish(a.page, 1, '寫一次性的感謝信', [Q.rulesWritable]);
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');
  await fillWish(b.page, 0, '別人的事', [Q.repeats]);
  await expect(b.page.getByTestId('save-status')).toHaveText('已儲存');

  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const exportButton = presenter.page.getByRole('button', { name: '匯出 CSV' });
  await expect(exportButton).toBeEnabled();
  const [download] = await Promise.all([presenter.page.waitForEvent('download'), exportButton.click()]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Uint8Array));
  const bytes = Buffer.concat(chunks);
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

  const text = bytes.toString('utf8').slice(1);
  const rows = text.split('\r\n');
  const optedIn = rows.find((r) => r.includes('整理公聽會逐字稿'));
  const notOpted = rows.find((r) => r.includes('寫一次性的感謝信'));
  const other = rows.find((r) => r.includes('別人的事'));
  expect(optedIn?.endsWith(',alice.wu')).toBe(true);
  expect(notOpted?.endsWith(',')).toBe(true);
  expect(other?.endsWith(',')).toBe(true);
  expect(text.match(/alice\.wu/g)).toHaveLength(1);
  expect(text).not.toContain('bob');
  expect(text).not.toContain('@');

  await a.context.close();
  await b.context.close();
  await presenter.context.close();
});

test('export button is presenter-only', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.scenario);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(a.page.getByTestId('scenario-board')).toBeVisible();
  await expect(a.page.getByRole('button', { name: '匯出 CSV' })).toHaveCount(0);
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  await expect(presenter.page.getByRole('button', { name: '匯出 CSV' })).toBeVisible();
  await a.context.close();
  await presenter.context.close();
});

test('scenario board lists only what, and an opt-in writes the name doc', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.scenario);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const b = await openAs(browser, baseURL, BOB, '#/');
  await expect(b.page.getByTestId('scenario-board')).toContainText('還沒有人填寫');
  await expect(b.page.getByRole('heading', { name: copy.scenarioBoardTitle })).toBeVisible();

  await a.page.getByRole('textbox', { name: '回去之後，你要交給代理的是哪一件工作？' }).fill('整理會員名單');
  await a.page.getByRole('textbox', { name: '會用到哪些檔案或資料？' }).fill('會員.csv');
  await a.page.getByRole('textbox', { name: '跟手做相比，好在哪裡：更快、更準，還是更完整？' }).fill('比較快');
  await a.page.getByRole('checkbox', { name: OPT_IN }).check();
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');

  const board = b.page.getByTestId('scenario-board');
  await expect(board).toContainText('整理會員名單');
  const text = await board.innerText();
  for (const forbidden of ['會員.csv', '比較快', 'alice', '@gcaa']) expect(text).not.toContain(forbidden);
  expect(await adminGetDoc(`names/${(await adminListIds('names'))[0]}`)).toEqual({ displayName: 'alice.wu' });
  expect(await adminGetDoc(`entries/scenario/users/${(await adminListIds('entries/scenario/users'))[0]}`)).toEqual({
    what: '整理會員名單',
    files: '會員.csv',
    gain: '比較快',
    optInName: true,
  });
  await a.context.close();
  await b.context.close();
});

test('warm-up saves marks and note, restores after reload, and the tally counts both users', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.warmup);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const b = await openAs(browser, baseURL, BOB, '#/');
  await expect(a.page.getByTestId('warm-tally')).toContainText('還沒有人填寫');
  await expect(a.page.getByTestId('warm-notes')).toHaveCount(0);
  await expect(a.page.getByText(copy.warmNotesHeading)).toHaveCount(0);

  await a.page.getByTestId('warm-row-press').getByRole('button', { name: '已經在用 AI' }).click();
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');
  await b.page.getByTestId('warm-row-press').getByRole('button', { name: '已經在用 AI' }).click();
  await expect(b.page.getByTestId('save-status')).toHaveText('已儲存');
  await a.page.getByTestId('warm-row-visit').getByRole('button', { name: '還沒用過' }).click();
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');
  await a.page.getByRole('textbox', { name: '想補充一句：哪裡好用、哪裡卡住' }).fill('逐字稿很好用');
  await expect
    .poll(async () => {
      const ids = await adminListIds('entries/warmup/users');
      const docs = await Promise.all(ids.map((id) => adminGetDoc(`entries/warmup/users/${id}`)));
      return docs.some((d) => d?.note === '逐字稿很好用');
    })
    .toBe(true);
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');

  const notes = b.page.getByTestId('warm-notes');
  await expect(notes.getByRole('heading', { name: copy.warmNotesHeading })).toBeVisible();
  await expect(notes.getByRole('listitem')).toHaveText(['逐字稿很好用']);
  const noteText = await notes.innerText();
  for (const forbidden of ['alice', 'bob', '@gcaa']) expect(noteText.toLowerCase()).not.toContain(forbidden);
  await expect(b.page.getByTestId('tally-press-using')).toHaveText('2');
  await expect(b.page.getByTestId('tally-visit-none')).toHaveText('1');
  await expect(b.page.getByTestId('tally-visit-using')).toHaveText('0');

  await a.page.reload();
  await expect(a.page.getByTestId('warm-row-press').getByRole('button', { name: '已經在用 AI' })).toHaveAttribute('aria-pressed', 'true');
  await expect(a.page.getByTestId('warm-row-visit').getByRole('button', { name: '還沒用過' })).toHaveAttribute('aria-pressed', 'true');
  await expect(a.page.getByRole('textbox', { name: '想補充一句：哪裡好用、哪裡卡住' })).toHaveValue('逐字稿很好用');
  expect(await adminListIds('entries/warmup/users')).toHaveLength(2);
  await a.context.close();
  await b.context.close();
});

test('concept cards flip on tap and flip back', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.concepts);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const card = a.page.getByTestId('concept-mcp');
  await expect(card).toContainText('萬用轉接頭');
  await expect(card).not.toContainText('接上法規與判決資料庫後');
  await expect(a.page.getByTestId('concepts').getByRole('button')).toHaveCount(8);
  await card.click();
  await expect(card).toContainText('接上法規與判決資料庫後');
  await card.click();
  await expect(card).not.toContainText('接上法規與判決資料庫後');
  expect(await adminListIds('entries/habits/users')).toEqual([]);
  await a.context.close();
});

test('flowchart steps highlight and explain on tap', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.flowchart);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const step = a.page.getByTestId('flow-f3');
  await expect(step).toHaveAttribute('aria-pressed', 'false');
  await expect(a.page.getByText('只看資料夾裡的檔案，不上網，也不憑記憶。')).toHaveCount(0);
  await step.click();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  await expect(a.page.getByTestId('flow-detail')).toContainText('只看資料夾裡的檔案，不上網，也不憑記憶。');
  await a.page.getByTestId('flow-f5').click();
  await expect(step).toHaveAttribute('aria-pressed', 'false');
  await expect(a.page.getByTestId('flow-detail')).toContainText('查不到就說查不到');
  await a.context.close();
});

const LONG = 'Z'.repeat(150);

for (const name of ['warmup', 'habits', 'concepts', 'flowchart', 'wishlist', 'scenario'] as const) {
  test(`${name} fits 640 px without horizontal scroll`, async ({ browser, baseURL }) => {
    await seedSession(SLIDE[name], name === 'habits' ? ['habits'] : []);
    const other = await openAs(browser, baseURL, BOB, '#/');
    await other.page.setViewportSize({ width: 640, height: 800 });
    await expect(other.page.locator(`[data-slide-id="${name}"]`)).toBeVisible();
    if (name === 'wishlist') {
      await fillWish(other.page, 0, LONG, [Q.repeats, Q.rulesWritable, Q.sourceCheckable, OPT_IN]);
      await expect(other.page.getByTestId('save-status')).toHaveText('已儲存');
      await expect(other.page.getByTestId('wish-board')).toContainText(LONG);
    }
    if (name === 'scenario') {
      await other.page.getByRole('textbox', { name: '回去之後，你要交給代理的是哪一件工作？' }).fill(LONG);
      await expect(other.page.getByTestId('save-status')).toHaveText('已儲存');
      await expect(other.page.getByTestId('scenario-board')).toContainText(LONG);
    }
    if (name === 'habits') {
      await habit(other.page, 'h1').getByRole('button', { name: '過時', exact: true }).click();
      await expect(other.page.getByTestId('save-status')).toHaveText('已儲存');
      await expect(habit(other.page, 'h1').getByTestId('split-outdated')).toContainText('1');
    }
    if (name === 'concepts') await other.page.getByTestId('concept-skill').click();
    if (name === 'flowchart') await other.page.getByTestId('flow-f8').click();
    const overflow = await other.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await other.context.close();
  });
}
