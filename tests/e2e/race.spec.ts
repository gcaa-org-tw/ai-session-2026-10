import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import JSZip from 'jszip';
import { copy } from '../../src/content/copy';
import { readFile } from 'node:fs/promises';
import {
  adminGetDoc,
  adminListIds,
  ANSWER_KEY,
  KIT_FILES,
  openAs,
  PRESENTER,
  RELEASE,
  resetEmulators,
  seedDoc,
  seedRaceContent,
  seedSession,
  SLIDE,
} from './helpers';

const ALICE = 'alice.wu@gcaa.org.tw';
const BOB = 'bob.lin@gcaa.org.tw';

test.beforeEach(async () => {
  await resetEmulators();
  await seedRaceContent();
});

function kitButton(page: Page, block: 'race' | 'folder-rules') {
  return page.locator(`#block-${block}`).getByRole('button', { name: '下載練習包' });
}

function kitError(page: Page, block: 'race' | 'folder-rules') {
  return page.locator(`#block-${block}`).getByTestId('kit-error');
}

function sentence(page: Page, id: string) {
  return page.getByTestId(`race-sentence-${id}`);
}

async function judge(page: Page, id: string, verdict: string) {
  await sentence(page, id).getByRole('button').first().click();
  await sentence(page, id).getByRole('button', { name: verdict, exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('已儲存');
}

async function pickRole(page: Page, role: string) {
  await page.getByRole('button', { name: role, exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('已儲存');
}

async function enter(page: Page, role: string, code: string, verdicts: Record<string, string>) {
  await expect(sentence(page, 's1')).toBeVisible();
  await pickRole(page, role);
  await page.getByLabel('組別代碼').fill(code);
  await expect(page.getByTestId('save-status')).toHaveText('已儲存');
  for (const [id, verdict] of Object.entries(verdicts)) await judge(page, id, verdict);
}

test('follower cannot read the answer key but can read the mock release', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  await expect(sentence(page, 's1')).toBeVisible();
  const token = await page.evaluate(() => (window as unknown as { __e2eIdToken: () => Promise<string> }).__e2eIdToken());
  const base = 'http://127.0.0.1:8080/v1/projects/demo-ai-session/databases/(default)/documents/private';
  const denied = await fetch(`${base}/answerKey`, { headers: { Authorization: `Bearer ${token}` } });
  expect(denied.status).toBe(403);
  expect(((await denied.json()) as { error: { status: string } }).error.status).toBe('PERMISSION_DENIED');
  const notes = await fetch(`${base}/notes`, { headers: { Authorization: `Bearer ${token}` } });
  expect(notes.status).toBe(403);
  const allowed = await fetch(`${base}/mockRelease`, { headers: { Authorization: `Bearer ${token}` } });
  expect(allowed.status).toBe(200);
  await context.close();
});

test('follower can read the race results only after the reveal', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.raceBoard);
  await seedDoc('public/raceResults', {
    human: { entries: 1, caughtAvg: 1, missedAvg: 1, falseAlarmsAvg: 0, perSentence: { s2: 1, s4: 0 } },
    agent: { entries: 0, caughtAvg: 0, missedAvg: 0, falseAlarmsAvg: 0, perSentence: { s2: 0, s4: 0 } },
    planted: ['s2', 's4'],
    explanations: { s2: ANSWER_KEY.s2.explanation, s4: ANSWER_KEY.s4.explanation },
  });
  const { context, page } = await openAs(browser, baseURL, ALICE, '#/');
  await expect(page.getByText('等待主持人揭曉')).toBeVisible();
  const token = await page.evaluate(() => (window as unknown as { __e2eIdToken: () => Promise<string> }).__e2eIdToken());
  const url = 'http://127.0.0.1:8080/v1/projects/demo-ai-session/databases/(default)/documents/public/raceResults';
  const before = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  expect(before.status).toBe(403);
  await seedSession(SLIDE.raceBoard, ['race']);
  await expect(page.getByTestId('race-planted-s2')).toContainText(ANSWER_KEY.s2.explanation);
  const after = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  expect(after.status).toBe(200);
  await context.close();
});

test('follower never requests the answer key; presenter does', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const bodies: Record<string, string[]> = { follower: [], presenter: [] };
  const follower = await openAs(browser, baseURL, ALICE, '#/');
  follower.page.on('request', (r) => bodies.follower?.push(r.url() + (r.postData() ?? '')));
  await follower.page.reload();
  await expect(sentence(follower.page, 's1')).toBeVisible();
  await pickRole(follower.page, '人工查核');
  await judge(follower.page, 's2', '不符');
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  presenter.page.on('request', (r) => bodies.presenter?.push(r.url() + (r.postData() ?? '')));
  await presenter.page.reload();
  await expect(presenter.page.getByTestId('presenter-current').getByRole('button', { name: '揭曉' })).toBeEnabled();
  expect(bodies.follower?.some((b) => b.includes('answerKey'))).toBe(false);
  expect(bodies.follower?.some((b) => b.includes('mockRelease'))).toBe(true);
  expect(bodies.presenter?.some((b) => b.includes('answerKey'))).toBe(true);
  await follower.context.close();
  await presenter.context.close();
});

test('human and agent enter, presenter reveals, board shows per-role counts', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const b = await openAs(browser, baseURL, BOB, '#/');
  await enter(a.page, '人工查核', 'A1', { s2: '不符', s3: '不符', s5: '相符' });
  await enter(b.page, '代理查核', 'A1', { s2: '不符', s4: '查無來源' });

  await expect(sentence(a.page, 's2')).toHaveAttribute('data-verdict', 'mismatch');
  await expect(sentence(a.page, 's5')).toHaveAttribute('data-verdict', 'match');
  await expect(sentence(a.page, 's1')).not.toHaveAttribute('data-verdict', /./);

  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const current = presenter.page.getByTestId('presenter-current');
  await expect(current.getByTestId('race-count-human')).toContainText('1');
  await expect(current.getByTestId('race-count-agent')).toContainText('1');
  expect(await adminGetDoc('public/raceResults')).toBeNull();
  await current.getByRole('button', { name: '揭曉' }).click();
  await expect(current.getByRole('button', { name: '揭曉' })).toHaveCount(0);

  const results = await adminGetDoc('public/raceResults');
  expect(results).toMatchObject({
    planted: ['s2', 's4'],
    explanations: { s2: ANSWER_KEY.s2.explanation, s4: ANSWER_KEY.s4.explanation },
    human: { entries: 1, caughtAvg: 1, missedAvg: 1, falseAlarmsAvg: 1, perSentence: { s2: 1, s4: 0 } },
    agent: { entries: 1, caughtAvg: 2, missedAvg: 0, falseAlarmsAvg: 0, perSentence: { s2: 1, s4: 1 } },
  });
  expect(await adminListIds('entries/race/users')).toHaveLength(2);

  await seedSession(SLIDE.raceBoard, ['race']);
  for (const page of [a.page, b.page]) {
    const board = page.getByTestId('race-board');
    await expect(board.getByTestId('race-planted-s2')).toContainText(RELEASE.sentences[1]?.text ?? '');
    await expect(board.getByTestId('race-planted-s2')).toContainText(ANSWER_KEY.s2.explanation);
    await expect(board.getByTestId('race-planted-s4')).toContainText(ANSWER_KEY.s4.explanation);
    await expect(board.getByTestId('race-planted-s2').getByTestId('race-caught-human')).toHaveText('1');
    await expect(board.getByTestId('race-planted-s2').getByTestId('race-caught-agent')).toHaveText('1');
    await expect(board.getByTestId('race-planted-s4').getByTestId('race-caught-human')).toHaveText('0');
    await expect(board.getByTestId('race-planted-s4').getByTestId('race-caught-agent')).toHaveText('1');
    await expect(board.getByTestId('race-avg-human-caught')).toHaveText('1.0');
    await expect(board.getByTestId('race-avg-human-missed')).toHaveText('1.0');
    await expect(board.getByTestId('race-avg-human-falseAlarms')).toHaveText('1.0');
    await expect(board.getByTestId('race-avg-agent-caught')).toHaveText('2.0');
    await expect(board.getByTestId('race-avg-agent-missed')).toHaveText('0.0');
    await expect(board.getByTestId('race-avg-agent-falseAlarms')).toHaveText('0.0');
  }
  await a.context.close();
  await b.context.close();
  await presenter.context.close();
});

test('board shows the waiting label before the reveal and nothing from the key', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.raceBoard);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(a.page.getByText('等待主持人揭曉')).toBeVisible();
  await expect(a.page.getByText(ANSWER_KEY.s2.explanation)).toHaveCount(0);
  await expect(a.page.getByRole('button', { name: '揭曉' })).toHaveCount(0);
  await a.context.close();
});

test('revealed board with no entries shows the empty state', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.raceBoard, ['race']);
  await seedDoc('public/raceResults', {
    human: { entries: 0, caughtAvg: 0, missedAvg: 0, falseAlarmsAvg: 0, perSentence: { s2: 0, s4: 0 } },
    agent: { entries: 0, caughtAvg: 0, missedAvg: 0, falseAlarmsAvg: 0, perSentence: { s2: 0, s4: 0 } },
    planted: ['s2', 's4'],
    explanations: { s2: 'x', s4: 'y' },
  });
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(a.page.getByTestId('race-board')).toContainText('還沒有人填寫');
  await a.context.close();
});

test('verdicts save under the uid, survive a reload, and a late joiner sees only their own', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await enter(a.page, '代理查核', 'G7', { s4: '查無來源' });
  expect(await adminListIds('entries/race/users')).toHaveLength(1);
  await a.page.reload();
  await expect(sentence(a.page, 's4')).toHaveAttribute('data-verdict', 'nosource');
  await expect(a.page.getByLabel('組別代碼')).toHaveValue('G7');
  await expect(a.page.getByRole('button', { name: '代理查核', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await judge(a.page, 's4', '相符');
  expect(await adminListIds('entries/race/users')).toHaveLength(1);

  const b = await openAs(browser, baseURL, BOB, '#/');
  await expect(sentence(b.page, 's1')).toBeVisible();
  await expect(sentence(b.page, 's4')).not.toHaveAttribute('data-verdict', /./);
  await a.context.close();
  await b.context.close();
});

test('offline save shows 儲存失敗, retry saves once', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(sentence(a.page, 's1')).toBeVisible();
  await pickRole(a.page, '人工查核');
  await a.context.setOffline(true);
  await sentence(a.page, 's2').getByRole('button').first().click();
  await sentence(a.page, 's2').getByRole('button', { name: '不符', exact: true }).click();
  await expect(a.page.getByTestId('save-status')).toHaveText('儲存失敗', { timeout: 15000 });
  await a.page.getByRole('button', { name: '再試一次' }).click();
  await expect(a.page.getByTestId('save-status')).toHaveText('儲存中');
  await a.context.setOffline(false);
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存', { timeout: 30000 });
  expect(await adminListIds('entries/race/users')).toHaveLength(1);
  await a.context.close();
});

test('without a role the race asks for one and does not open the verdict choice', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(sentence(a.page, 's2')).toBeVisible();
  await expect(a.page.getByTestId('race-pick-role')).toHaveText(copy.race.pickRoleFirst);
  const tap = sentence(a.page, 's2').getByRole('button').first();
  await expect(tap).toBeDisabled();
  await tap.click({ force: true });
  await expect(sentence(a.page, 's2').getByRole('button', { name: '不符', exact: true })).toHaveCount(0);
  await a.page.getByLabel('組別代碼').fill('Z9');
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');
  await expect(a.page.getByTestId('race-pick-role')).toBeVisible();
  await expect(tap).toBeDisabled();

  await pickRole(a.page, '代理查核');
  await expect(a.page.getByTestId('race-pick-role')).toHaveCount(0);
  await expect(tap).toBeEnabled();
  await tap.click();
  await expect(sentence(a.page, 's2').getByRole('button', { name: '不符', exact: true })).toBeVisible();
  await a.context.close();
});

test('an entry without a role is not counted for either role', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(sentence(a.page, 's1')).toBeVisible();
  await a.page.getByLabel('組別代碼').fill('Z9');
  await expect(a.page.getByTestId('save-status')).toHaveText('已儲存');
  expect(await adminListIds('entries/race/users')).toHaveLength(1);
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const current = presenter.page.getByTestId('presenter-current');
  await expect(current.getByTestId('race-count-human')).toContainText('0');
  await expect(current.getByTestId('race-count-agent')).toContainText('0');
  await current.getByRole('button', { name: '揭曉' }).click();
  await expect(current.getByRole('button', { name: '揭曉' })).toHaveCount(0);
  expect(await adminGetDoc('public/raceResults')).toMatchObject({ human: { entries: 0 }, agent: { entries: 0 } });
  await a.context.close();
  await presenter.context.close();
});

test('kit download builds 練習包.zip from the stored kit', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  const button = kitButton(a.page, 'race');
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([a.page.waitForEvent('download'), button.click()]);
  expect(download.suggestedFilename()).toBe('練習包.zip');
  const path = await download.path();
  const zip = await JSZip.loadAsync(await readFile(path));
  const names = Object.keys(zip.files).filter((n) => !zip.files[n]?.dir);
  expect(names.sort()).toEqual(Object.keys(KIT_FILES).sort());
  expect(names).toContain('AGENTS.md');
  expect(names).toContain('.agents/skills/fact-check/SKILL.md');
  expect(await zip.file('AGENTS.md')?.async('string')).toBe(KIT_FILES['AGENTS.md']);
  await expect(button).toBeEnabled();
  await a.context.close();
});

test('the folder-rules slide offers the same kit download', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.folderRules);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(a.page.locator('[data-slide-id="folder-rules"]')).toBeVisible();
  const button = kitButton(a.page, 'folder-rules');
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([a.page.waitForEvent('download'), button.click()]);
  expect(download.suggestedFilename()).toBe('練習包.zip');
  const zip = await JSZip.loadAsync(await readFile(await download.path()));
  expect(Object.keys(zip.files).filter((n) => !zip.files[n]?.dir).sort()).toEqual(Object.keys(KIT_FILES).sort());
  expect(await adminListIds('entries/race/users')).toHaveLength(0);
  await a.context.close();
});

test('the folder-rules slide shows the missing-kit error and a disabled button', async ({ browser, baseURL }) => {
  await resetEmulators();
  await seedSession(SLIDE.folderRules);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(kitButton(a.page, 'folder-rules')).toBeDisabled();
  await expect(kitError(a.page, 'folder-rules')).toBeVisible();
  await a.context.close();
});

test('presenter preview of the folder-rules slide does not mount the download', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.folderRules - 1);
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const next = presenter.page.getByTestId('presenter-next');
  await expect(next.locator('[data-slide-id="folder-rules"]')).toBeVisible();
  await expect(next.getByRole('button', { name: '下載練習包' })).toHaveCount(0);
  await presenter.context.close();
});

test('missing kit disables the download and shows the error', async ({ browser, baseURL }) => {
  await resetEmulators();
  await seedDoc('private/mockRelease', RELEASE);
  await seedSession(SLIDE.race);
  const a = await openAs(browser, baseURL, ALICE, '#/');
  await expect(sentence(a.page, 's1')).toBeVisible();
  await expect(kitButton(a.page, 'race')).toBeDisabled();
  await expect(kitError(a.page, 'race')).toBeVisible();
  await a.context.close();
});

test('presenter next-slide preview of the race does not mount the activity', async ({ browser, baseURL }) => {
  await seedSession(SLIDE.race - 1);
  const presenter = await openAs(browser, baseURL, PRESENTER, '#/presenter');
  const next = presenter.page.getByTestId('presenter-next');
  await expect(next.locator('[data-slide-id="race"]')).toBeVisible();
  await expect(next.getByText(RELEASE.title)).toHaveCount(0);
  await expect(next.getByRole('button', { name: '下載練習包' })).toHaveCount(0);
  expect(await adminListIds('entries/race/users')).toHaveLength(0);
  await presenter.context.close();
});

const LONG = 'Q'.repeat(150);

for (const name of ['race', 'raceBoard'] as const) {
  test(`${name} fits 640 px without horizontal scroll`, async ({ browser, baseURL }) => {
    await seedDoc('private/mockRelease', {
      title: RELEASE.title,
      sentences: [...RELEASE.sentences.slice(0, 1), { id: 's2', text: LONG }, ...RELEASE.sentences.slice(2)],
    });
    await seedDoc('public/raceResults', {
      human: { entries: 1, caughtAvg: 1, missedAvg: 1, falseAlarmsAvg: 1, perSentence: { s2: 1, s4: 0 } },
      agent: { entries: 1, caughtAvg: 2, missedAvg: 0, falseAlarmsAvg: 0, perSentence: { s2: 1, s4: 1 } },
      planted: ['s2', 's4'],
      explanations: { s2: LONG, s4: ANSWER_KEY.s4.explanation },
    });
    await seedSession(SLIDE[name], name === 'raceBoard' ? ['race'] : []);
    const a = await openAs(browser, baseURL, ALICE, '#/');
    await a.page.setViewportSize({ width: 640, height: 800 });
    if (name === 'race') {
      await expect(sentence(a.page, 's2')).toBeVisible();
      await pickRole(a.page, '人工查核');
      await a.page.getByLabel('組別代碼').fill(LONG);
      await judge(a.page, 's2', '不符');
      await sentence(a.page, 's2').getByRole('button').first().click();
      await expect(sentence(a.page, 's2').getByRole('button', { name: '查無來源', exact: true })).toBeVisible();
    } else {
      await expect(a.page.getByTestId('race-planted-s2')).toContainText(LONG);
    }
    const overflow = await a.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await a.context.close();
  });
}
