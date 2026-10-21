import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import JSZip from 'jszip';
import { adminGetDoc, openAs, PRESENTER, resetEmulators } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

const release = { title: '模擬稿', sentences: [{ id: 's1', text: '第一句' }, { id: 's2', text: '第二句' }] };
const key = { s2: { verdict: 'mismatch', explanation: '數字不符' } };

function json(name: string, value: unknown) {
  return { name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) };
}

async function kitZip(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('AGENTS.md', '# 規則\n');
  zip.file('.agents/skills/fact-check/SKILL.md', '---\nname: fact-check\n---\n查核');
  zip.file('六都簽署名單.csv', '縣市,簽署\n台北,是\n');
  zip.folder('empty-dir');
  zip.file('__MACOSX/._AGENTS.md', 'junk');
  return zip.generateAsync({ type: 'nodebuffer' });
}

async function submit(page: Page) {
  await page.getByRole('button', { name: '上傳並儲存' }).click();
}

test('non-presenter is turned away from the upload page', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, 'a@gcaa.org.tw', '#/upload');
  await expect(page.getByText('此頁僅限主持人')).toBeVisible();
  await context.close();
});

test('uploads all four files and stores them', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/upload');
  await page.getByLabel('模擬稿').setInputFiles(json('mock-release.json', release));
  await page.getByLabel('答案').setInputFiles(json('answer-key.json', key));
  await page.getByLabel('備忘稿').setInputFiles(json('notes.json', { opening: '開場備忘' }));
  await page.getByLabel('素材包').setInputFiles({ name: 'kit.zip', mimeType: 'application/zip', buffer: await kitZip() });
  await submit(page);

  for (const id of ['mockRelease', 'answerKey', 'notes', 'kit']) {
    await expect(page.getByTestId(`result-${id}`)).toContainText('成功');
  }
  expect(await adminGetDoc('private/mockRelease')).toEqual(release);
  expect(await adminGetDoc('private/answerKey')).toEqual(key);
  expect(await adminGetDoc('private/notes')).toEqual({ opening: '開場備忘' });
  expect(await adminGetDoc('private/kit')).toEqual({
    files: {
      'AGENTS.md': '# 規則\n',
      '.agents/skills/fact-check/SKILL.md': '---\nname: fact-check\n---\n查核',
      '六都簽署名單.csv': '縣市,簽署\n台北,是\n',
    },
  });
  await context.close();
});

test('writes nothing when one file fails to parse', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/upload');
  await page.getByLabel('模擬稿').setInputFiles(json('mock-release.json', release));
  await page.getByLabel('備忘稿').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{oops') });
  await submit(page);

  await expect(page.getByTestId('result-notes')).toContainText('失敗');
  await expect(page.getByTestId('result-mockRelease')).toContainText('失敗');
  expect(await adminGetDoc('private/mockRelease')).toBeNull();
  expect(await adminGetDoc('private/notes')).toBeNull();
  await context.close();
});

test('refuses an answer key whose ids are not in the release', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/upload');
  await page.getByLabel('模擬稿').setInputFiles(json('mock-release.json', release));
  await page.getByLabel('答案').setInputFiles(json('answer-key.json', { s9: { verdict: 'nosource', explanation: '無來源' } }));
  await submit(page);

  await expect(page.getByTestId('result-answerKey')).toContainText('失敗');
  await expect(page.getByTestId('result-answerKey')).toContainText('s9');
  expect(await adminGetDoc('private/mockRelease')).toBeNull();
  expect(await adminGetDoc('private/answerKey')).toBeNull();
  await context.close();
});

test('an answer key alone is checked against the stored release, or refused', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/upload');
  await page.getByLabel('答案').setInputFiles(json('answer-key.json', key));
  await submit(page);
  await expect(page.getByTestId('result-answerKey')).toContainText('失敗');
  await expect(page.getByTestId('result-answerKey')).toContainText('尚未上傳模擬稿');
  expect(await adminGetDoc('private/answerKey')).toBeNull();

  await page.getByLabel('模擬稿').setInputFiles(json('mock-release.json', release));
  await submit(page);
  await expect(page.getByTestId('result-mockRelease')).toContainText('成功');
  await expect(page.getByTestId('result-answerKey')).toContainText('成功');

  await page.getByLabel('模擬稿').setInputFiles([]);
  await page.getByLabel('答案').setInputFiles(json('answer-key.json', { s1: { verdict: 'nosource', explanation: '無來源' } }));
  await submit(page);
  await expect(page.getByTestId('result-answerKey')).toContainText('成功');
  expect(await adminGetDoc('private/answerKey')).toEqual({ s1: { verdict: 'nosource', explanation: '無來源' } });
  await context.close();
});

test('a release alone is refused when no answer key is stored', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/upload');
  await page.getByLabel('模擬稿').setInputFiles(json('mock-release.json', release));
  await submit(page);
  await expect(page.getByTestId('result-mockRelease')).toContainText('失敗');
  await expect(page.getByTestId('result-mockRelease')).toContainText('尚未上傳答案');
  expect(await adminGetDoc('private/mockRelease')).toBeNull();
  await context.close();
});

test('the upload button is disabled until a file is chosen', async ({ browser, baseURL }) => {
  const { context, page } = await openAs(browser, baseURL, PRESENTER, '#/upload');
  await expect(page.getByRole('button', { name: '上傳並儲存' })).toBeDisabled();
  await page.getByLabel('備忘稿').setInputFiles(json('notes.json', { opening: 'x' }));
  await expect(page.getByRole('button', { name: '上傳並儲存' })).toBeEnabled();
  await context.close();
});
