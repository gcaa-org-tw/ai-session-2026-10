import { useState } from 'react';
import type { ReactNode } from 'react';
import { describeError, signIn, signOutAndSwitch, useAuth } from './useAuth';
import type { AuthState } from './useAuth';

export type ReadyAuth = Extract<AuthState, { status: 'ready' }>;

interface AuthGateProps {
  children: (auth: ReadyAuth) => ReactNode;
}

const POPUP_CLOSED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

function signInMessage(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
  if (POPUP_CLOSED.includes(code)) return '登入視窗已關閉，請再試一次。';
  if (code === 'auth/popup-blocked') return '瀏覽器擋住了登入視窗，請允許彈出視窗後再試一次。';
  return `登入失敗：${describeError(err)}`;
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow sm:p-8">{children}</div>
    </main>
  );
}

const primaryButton =
  'rounded-lg bg-emerald-700 px-5 py-3 text-base font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50';

function SignedOutScreen() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setPending(true);
    setError(null);
    try {
      await signIn();
    } catch (err) {
      setError(signInMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <h1 className="mb-2 text-2xl font-bold">AI 分享會</h1>
      <p className="mb-6 text-slate-600">請使用綠色公民行動聯盟的帳號登入。</p>
      <button type="button" className={primaryButton} disabled={pending} onClick={handleSignIn}>
        {pending ? '登入中…' : '用 gcaa.org.tw 帳號登入'}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </Screen>
  );
}

function DeniedScreen({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSwitch() {
    setPending(true);
    setError(null);
    try {
      await signOutAndSwitch();
    } catch (err) {
      setError(`切換失敗：${describeError(err)}`);
      setPending(false);
    }
  }

  return (
    <Screen>
      <h1 className="mb-2 text-2xl font-bold">這不是 gcaa.org.tw 帳號</h1>
      <p className="mb-6 break-all text-slate-600">
        目前登入的是 <strong data-testid="denied-email">{email}</strong>，只有 gcaa.org.tw 的帳號可以進入。
      </p>
      <button type="button" className={primaryButton} disabled={pending} onClick={handleSwitch}>
        {pending ? '切換中…' : '換一個帳號'}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </Screen>
  );
}

export default function AuthGate({ children }: AuthGateProps) {
  const auth = useAuth();

  switch (auth.status) {
    case 'loading':
      return (
        <Screen>
          <div
            role="status"
            aria-label="載入中"
            className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700"
          />
          <p className="mt-4 text-slate-600">載入中…</p>
        </Screen>
      );
    case 'signedOut':
      return <SignedOutScreen />;
    case 'denied':
      return <DeniedScreen email={auth.email} />;
    case 'error':
      return (
        <Screen>
          <h1 className="mb-2 text-2xl font-bold">無法連線</h1>
          <p role="alert" className="mb-6 break-words text-red-700">
            {auth.message}
          </p>
          <button type="button" className={primaryButton} onClick={() => window.location.reload()}>
            重試
          </button>
        </Screen>
      );
    case 'ready':
      return <>{children(auth)}</>;
  }
}
