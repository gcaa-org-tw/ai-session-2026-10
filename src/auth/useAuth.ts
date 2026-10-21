import { useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';
import { getFirebase } from '../firebase';
import { isAllowedUser, isPresenter } from '../lib/access';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'denied'; email: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; user: User; presenter: boolean };

export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function initAuth(): { auth: Auth } | { initError: string } {
  try {
    return { auth: getFirebase().auth };
  } catch (err) {
    return { initError: describeError(err) };
  }
}

export function useAuth(): AuthState {
  const [init] = useState(initAuth);
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const auth = 'auth' in init ? init.auth : null;

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setState({ status: 'signedOut' });
          return;
        }
        if (!isAllowedUser(user.email, user.emailVerified)) {
          setState({ status: 'denied', email: user.email ?? '（無電子郵件）' });
          return;
        }
        setState({ status: 'ready', user, presenter: isPresenter(user.uid, user.email, user.emailVerified) });
      },
      (err) => setState({ status: 'error', message: describeError(err) }),
    );
  }, [auth]);

  if ('initError' in init) return { status: 'error', message: init.initError };
  return state;
}

export async function signIn(): Promise<void> {
  const { auth } = getFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: 'gcaa.org.tw', prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function signOutAndSwitch(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
}
