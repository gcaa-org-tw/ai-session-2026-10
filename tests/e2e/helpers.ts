import type { Browser, BrowserContext, Page } from '@playwright/test';

const PROJECT = 'demo-ai-session';

export const PRESENTER = 'presenter@example.com';

async function expectOk(res: Response, what: string): Promise<void> {
  if (!res.ok) throw new Error(`${what} failed: ${res.status}`);
}

export async function resetEmulators(): Promise<void> {
  await expectOk(
    await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' }),
    'clear firestore',
  );
  await expectOk(
    await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' }),
    'clear auth',
  );
}

export async function openAs(browser: Browser, baseURL: string | undefined, email: string, hash: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto(hash);
  await page.waitForFunction(() => typeof (window as unknown as { __e2eSignIn?: unknown }).__e2eSignIn === 'function');
  await page.evaluate((e) => (window as unknown as { __e2eSignIn: (email: string) => Promise<void> }).__e2eSignIn(e), email);
  return { context, page };
}

const FS_BASE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields?: Record<string, FsValue> } }
  | { arrayValue: { values?: FsValue[] } };

function decode(v: FsValue): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(decode);
  const out: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(v.mapValue.fields ?? {})) out[k] = decode(f);
  return out;
}

export async function adminGetDoc(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${FS_BASE}/${path}`, { headers: ADMIN });
  if (res.status === 404) return null;
  await expectOk(res, `read ${path}`);
  const body = (await res.json()) as { fields?: Record<string, FsValue> };
  return decode({ mapValue: { fields: body.fields } }) as Record<string, unknown>;
}

export async function adminListIds(collectionPath: string): Promise<string[]> {
  const res = await fetch(`${FS_BASE}/${collectionPath}`, { headers: ADMIN });
  await expectOk(res, `list ${collectionPath}`);
  const body = (await res.json()) as { documents?: { name: string }[] };
  return (body.documents ?? []).map((d) => d.name.split('/').pop() ?? '');
}

export const SLIDE = { warmup: 1, habits: 3, concepts: 5, flowchart: 7, wishlist: 11, race: 15, raceBoard: 16, scenario: 18 } as const;

export async function seedSession(slideIndex: number, revealed: string[] = []): Promise<void> {
  const res = await fetch(`${FS_BASE}/session/live`, {
    method: 'PATCH',
    headers: ADMIN,
    body: JSON.stringify({
      fields: {
        slideIndex: { integerValue: String(slideIndex) },
        openActivity: { nullValue: null },
        revealed: { mapValue: { fields: Object.fromEntries(revealed.map((id) => [id, { booleanValue: true }])) } },
      },
    }),
  });
  await expectOk(res, 'seed session');
}

export async function seedNotes(notes: Record<string, string>): Promise<void> {
  const fields: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(notes)) fields[k] = { stringValue: v };
  const res = await fetch(`${FS_BASE}/private/notes`, {
    method: 'PATCH',
    headers: ADMIN,
    body: JSON.stringify({ fields }),
  });
  await expectOk(res, 'seed notes');
}

function encode(v: unknown): FsValue {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return { integerValue: String(v) };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  const fields: Record<string, FsValue> = {};
  for (const [k, f] of Object.entries(v as Record<string, unknown>)) fields[k] = encode(f);
  return { mapValue: { fields } };
}

export async function seedDoc(path: string, data: Record<string, unknown>): Promise<void> {
  const fields: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = encode(v);
  const res = await fetch(`${FS_BASE}/${path}`, { method: 'PATCH', headers: ADMIN, body: JSON.stringify({ fields }) });
  await expectOk(res, `seed ${path}`);
}

export const RELEASE = {
  title: '模擬稿，內容含虛構資訊｜測試新聞稿',
  sentences: [
    { id: 's1', text: '第一句是正確的。' },
    { id: 's2', text: '第二句有數字錯誤。' },
    { id: 's3', text: '第三句也是正確的。' },
    { id: 's4', text: '第四句沒有來源。' },
    { id: 's5', text: '第五句是正確的。' },
  ],
};

export const ANSWER_KEY = {
  s2: { verdict: 'mismatch', explanation: '名單顯示是23位，不是25位。' },
  s4: { verdict: 'nosource', explanation: '練習包裡沒有可佐證的資料。' },
};

export const KIT_FILES = {
  'AGENTS.md': '# 規則\n',
  '.agents/skills/fact-check/SKILL.md': '---\nname: fact-check\n---\n查核',
  '六都簽署名單.csv': '縣市,簽署\n台北,是\n',
};

export async function seedRaceContent(): Promise<void> {
  await seedDoc('private/mockRelease', RELEASE);
  await seedDoc('private/answerKey', ANSWER_KEY);
  await seedDoc('private/kit', { files: KIT_FILES });
}
