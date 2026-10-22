import { useSyncExternalStore } from 'react';

const WIDE = '(min-width: 1024px)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function snapshot(): boolean {
  return window.matchMedia(WIDE).matches;
}

export function useWideLayout(): boolean {
  return useSyncExternalStore(subscribe, snapshot);
}
