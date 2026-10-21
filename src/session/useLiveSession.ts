import { useEffect, useState } from 'react';
import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { getFirebase } from '../firebase';
import { clampSlide } from '../lib/slideNav';
import type { ActivityId, LiveSession } from '../lib/types';
import { slides } from '../slides/slides';

export const DEFAULT_SESSION: LiveSession = { slideIndex: 0, openActivity: null, revealed: {} };

const ACTIVITY_IDS: ActivityId[] = ['warmup', 'habits', 'wishlist', 'race', 'scenario'];

function liveRef() {
  const { db } = getFirebase();
  return doc(db, 'session', 'live');
}

function isActivityId(v: unknown): v is ActivityId {
  return typeof v === 'string' && (ACTIVITY_IDS as string[]).includes(v);
}

export function parseLiveSession(data: Record<string, unknown>): LiveSession {
  const revealed: LiveSession['revealed'] = {};
  const raw = data.revealed;
  if (typeof raw === 'object' && raw !== null) {
    for (const id of ACTIVITY_IDS) {
      const v = (raw as Record<string, unknown>)[id];
      if (typeof v === 'boolean') revealed[id] = v;
    }
  }
  return {
    slideIndex: typeof data.slideIndex === 'number' ? clampSlide(data.slideIndex, slides.length) : 0,
    openActivity: isActivityId(data.openActivity) ? data.openActivity : null,
    revealed,
  };
}

function initRef(): { ref: DocumentReference } | { initError: string } {
  try {
    return { ref: liveRef() };
  } catch (err) {
    return { initError: err instanceof Error ? err.message : String(err) };
  }
}

export function useLiveSession(): { state: LiveSession | null; error: string | null } {
  const [init] = useState(initRef);
  const [state, setState] = useState<LiveSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = 'ref' in init ? init.ref : null;

  useEffect(() => {
    if (!ref) return undefined;
    return onSnapshot(
      ref,
      (snap) => {
        setError(null);
        const data = snap.data();
        setState(data ? parseLiveSession(data) : null);
      },
      (err) => setError(err.message),
    );
  }, [ref]);

  if ('initError' in init) return { state: null, error: init.initError };
  return { state, error };
}

let ensuring: Promise<void> | null = null;

export function ensureLiveSession(): Promise<void> {
  ensuring ??= (async () => {
    const { db } = getFirebase();
    const ref = liveRef();
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) tx.set(ref, DEFAULT_SESSION);
    });
  })().finally(() => {
    ensuring = null;
  });
  return ensuring;
}

export async function setSlide(i: number): Promise<void> {
  await setDoc(liveRef(), { slideIndex: clampSlide(i, slides.length) }, { merge: true });
}

export async function setOpenActivity(a: ActivityId | null): Promise<void> {
  await setDoc(liveRef(), { openActivity: a }, { merge: true });
}

export async function setRevealed(a: ActivityId, v: boolean): Promise<void> {
  await setDoc(liveRef(), { revealed: { [a]: v } }, { merge: true });
}
