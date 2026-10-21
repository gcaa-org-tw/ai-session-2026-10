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
