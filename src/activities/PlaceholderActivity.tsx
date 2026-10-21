import { useState } from 'react';
import { useMyEntry } from '../entries/useEntries';
import type { HabitsEntry } from '../lib/types';

const CARDS = [
  { id: 'summary', label: '自動摘要' },
  { id: 'search', label: '查資料' },
];

const buttonBase =
  'rounded-lg border-2 px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50';

export default function PlaceholderActivity() {
  const { value, status, error, save, retry } = useMyEntry<HabitsEntry>('habits');
  const [attempted, setAttempted] = useState(false);
  const busy = status === 'loading' || status === 'saving';

  function choose(id: string) {
    setAttempted(true);
    void save({ placements: { [id]: 'useful' } });
  }

  function statusText(): string {
    switch (status) {
      case 'loading':
        return '載入中…';
      case 'saving':
        return '儲存中…';
      case 'saved':
        return '已儲存';
      case 'error':
        return '儲存失敗';
      case 'idle':
        return value ? '已儲存' : '尚未填寫';
    }
  }

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-4 sm:p-10">
      <h1 className="text-2xl font-bold sm:text-4xl">日常習慣整理</h1>
      <p className="text-base text-slate-600 sm:text-xl">挑一張你最常用的卡片。</p>
      <div className="flex flex-wrap gap-3">
        {CARDS.map((c) => {
          const selected = value?.placements[c.id] === 'useful';
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected}
              disabled={busy}
              className={`${buttonBase} ${selected ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white'}`}
              onClick={() => choose(c.id)}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span data-testid="save-status" role="status" className={status === 'error' ? 'text-red-700' : 'text-slate-600'}>
          {statusText()}
        </span>
        {status === 'error' && (
          <button
            type="button"
            className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
            onClick={() => (attempted ? void retry() : window.location.reload())}
          >
            {attempted ? '重試' : '重新載入'}
          </button>
        )}
      </div>
      {status === 'error' && error && (
        <p role="alert" className="break-words text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
