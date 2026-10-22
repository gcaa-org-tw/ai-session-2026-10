import { useState } from 'react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { describeError } from '../auth/useAuth';
import { getFirebase } from '../firebase';
import { parseAnswerKey, parseKit, parseMockRelease, parseNotes } from '../lib/privateFiles';
import { validateAnswerKey } from '../lib/validate';
import type { AnswerKey, MockRelease } from '../lib/types';
import type { PrivateDocId } from '../private/usePrivateDoc';

interface UploadProps {
  presenter: boolean;
}

interface FileSlot {
  id: PrivateDocId;
  label: string;
  accept: string;
}

const SLOTS: FileSlot[] = [
  { id: 'mockRelease', label: '模擬稿（mock-release.json）', accept: '.json,application/json' },
  { id: 'answerKey', label: '答案（answer-key.json）', accept: '.json,application/json' },
  { id: 'notes', label: '備忘稿（notes.json）', accept: '.json,application/json' },
  { id: 'kit', label: '素材包（kit.zip）', accept: '.zip,application/zip' },
];

type Result = { ok: true } | { ok: false; reason: string };

type Chosen = Partial<Record<PrivateDocId, File>>;

const ABORTED = '另有檔案有誤，所有檔案都沒有寫入。';

const primaryButton =
  'rounded-lg bg-ink px-5 py-3 text-base font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50';

async function readStored<T>(id: PrivateDocId): Promise<T | null> {
  const snap = await getDoc(doc(getFirebase().db, 'private', id));
  return snap.exists() ? (snap.data() as T) : null;
}

async function parseChosen(chosen: Chosen): Promise<{ data: Partial<Record<PrivateDocId, object>>; failures: Partial<Record<PrivateDocId, string>> }> {
  const data: Partial<Record<PrivateDocId, object>> = {};
  const failures: Partial<Record<PrivateDocId, string>> = {};
  for (const slot of SLOTS) {
    const file = chosen[slot.id];
    if (!file) continue;
    try {
      switch (slot.id) {
        case 'mockRelease':
          data.mockRelease = parseMockRelease(await file.text());
          break;
        case 'answerKey':
          data.answerKey = parseAnswerKey(await file.text());
          break;
        case 'notes':
          data.notes = parseNotes(await file.text());
          break;
        case 'kit':
          data.kit = await parseKit(await file.arrayBuffer());
          break;
      }
    } catch (err) {
      failures[slot.id] = describeError(err);
    }
  }
  return { data, failures };
}

async function crossCheck(data: Partial<Record<PrivateDocId, object>>): Promise<Partial<Record<PrivateDocId, string>>> {
  const chosenRelease = data.mockRelease as MockRelease | undefined;
  const chosenKey = data.answerKey as AnswerKey | undefined;
  if (!chosenRelease && !chosenKey) return {};
  const blame: PrivateDocId = chosenKey ? 'answerKey' : 'mockRelease';
  try {
    const release = chosenRelease ?? (await readStored<MockRelease>('mockRelease'));
    const key = chosenKey ?? (await readStored<AnswerKey>('answerKey'));
    if (!release) return { [blame]: '尚未上傳模擬稿，無法核對答案，請同時選擇兩個檔案。' };
    if (!key) return { [blame]: '尚未上傳答案，無法核對模擬稿，請同時選擇兩個檔案。' };
    const problems = validateAnswerKey(release, key);
    return problems.length > 0 ? { [blame]: `答案與模擬稿不一致：${problems.join('；')}` } : {};
  } catch (err) {
    return { [blame]: `讀取已儲存的檔案失敗：${describeError(err)}` };
  }
}

function ResultLine({ id, result }: { id: PrivateDocId; result: Result | undefined }) {
  if (!result) return null;
  return (
    <p
      data-testid={`result-${id}`}
      role={result.ok ? 'status' : 'alert'}
      className={result.ok ? 'text-ok' : 'break-words text-proof'}
    >
      {result.ok ? '成功' : `失敗：${result.reason}`}
    </p>
  );
}

export default function Upload({ presenter }: UploadProps) {
  const [chosen, setChosen] = useState<Chosen>({});
  const [results, setResults] = useState<Partial<Record<PrivateDocId, Result>>>({});
  const [busy, setBusy] = useState(false);

  if (!presenter) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="w-full max-w-md rounded-xl bg-sheet p-6 text-center border border-grid">
          <h1 className="mb-4 font-kai text-2xl font-bold">此頁僅限主持人</h1>
          <a className="text-ink underline" href="#/">
            回到簡報
          </a>
        </div>
      </main>
    );
  }

  const chosenIds = SLOTS.filter((s) => chosen[s.id]).map((s) => s.id);

  function pick(id: PrivateDocId, file: File | undefined) {
    setChosen((prev) => {
      const rest = Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id));
      return file ? { ...rest, [id]: file } : rest;
    });
  }

  async function submit() {
    setBusy(true);
    setResults({});
    const next: Partial<Record<PrivateDocId, Result>> = {};
    try {
      const { data, failures } = await parseChosen(chosen);
      const cross = Object.keys(failures).length === 0 ? await crossCheck(data) : {};
      const allFailures = { ...failures, ...cross };
      if (Object.keys(allFailures).length > 0) {
        for (const id of chosenIds) {
          next[id] = { ok: false, reason: allFailures[id] ?? ABORTED };
        }
      } else {
        try {
          const { db } = getFirebase();
          const batch = writeBatch(db);
          for (const id of chosenIds) batch.set(doc(db, 'private', id), data[id] ?? {});
          await batch.commit();
          for (const id of chosenIds) next[id] = { ok: true };
        } catch (err) {
          for (const id of chosenIds) next[id] = { ok: false, reason: `寫入失敗：${describeError(err)}` };
        }
      }
    } catch (err) {
      for (const id of chosenIds) next[id] = { ok: false, reason: describeError(err) };
    } finally {
      setResults(next);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper p-4 sm:p-8">
      <div className="mx-auto flex max-w-xl flex-col gap-5 rounded-xl bg-sheet p-6 border border-grid">
        <h1 className="font-kai text-2xl font-bold">上傳私密檔案</h1>
        <p className="text-ink-muted">選好檔案後一次寫入；只要有一個檔案有誤，全部都不會寫入。</p>
        {SLOTS.map((slot) => (
          <div key={slot.id} className="flex flex-col gap-1">
            <label htmlFor={`file-${slot.id}`} className="font-semibold">
              {slot.label}
            </label>
            <input
              id={`file-${slot.id}`}
              type="file"
              accept={slot.accept}
              disabled={busy}
              onChange={(e) => pick(slot.id, e.target.files?.[0])}
            />
            <ResultLine id={slot.id} result={results[slot.id]} />
          </div>
        ))}
        <button
          type="button"
          className={primaryButton}
          disabled={busy || chosenIds.length === 0}
          onClick={() => void submit()}
        >
          {busy ? '上傳中…' : '上傳並儲存'}
        </button>
      </div>
    </main>
  );
}
