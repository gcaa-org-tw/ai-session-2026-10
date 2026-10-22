import { useMemo, useState } from 'react';
import { describeError } from '../auth/useAuth';
import { copy } from '../content/copy';
import { ui } from '../content/ui';
import { useAllEntries, useMyEntry } from '../entries/useEntries';
import { aggregateRace } from '../lib/scoring';
import type { AnswerKey, MockRelease, RaceEntry, Role, Verdict } from '../lib/types';
import { usePrivateDoc } from '../private/usePrivateDoc';
import { setRevealed, useLiveSession } from '../session/useLiveSession';
import { publishRaceResults } from './raceHooks';
import { useDraft } from './hooks';
import KitDownload from './KitDownload';
import type { ActivityProps } from './types';
import { buttonBase, LoadFailure, LoadingBlock, optionButton, primaryButton, SaveStatus, wrapText } from './ui';

const EMPTY: RaceEntry = { role: null, pairCode: '', findings: {} };
const ROLES: Role[] = ['human', 'agent'];
const VERDICTS: Verdict[] = ['match', 'mismatch', 'nosource'];

function isFlag(verdict: Verdict | undefined): boolean {
  return verdict === 'mismatch' || verdict === 'nosource';
}

interface SentenceListProps {
  release: MockRelease;
  entry: RaceEntry;
  busy: boolean;
  locked: boolean;
  onJudge: (sentenceId: string, verdict: Verdict) => void;
}

function SentenceList({ release, entry, busy, locked, onJudge }: SentenceListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ol className="flex flex-col gap-2">
      {release.sentences.map((sentence) => {
        const verdict = entry.findings[sentence.id];
        const open = openId === sentence.id;
        const tone = isFlag(verdict)
          ? 'border-proof bg-sheet'
          : verdict === 'match'
            ? 'border-ok bg-sheet'
            : 'border-grid-soft bg-sheet';
        return (
          <li
            key={sentence.id}
            data-testid={`race-sentence-${sentence.id}`}
            data-verdict={verdict}
            className={`flex flex-col gap-2 rounded-lg border-2 p-3 ${tone}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <button
                type="button"
                aria-expanded={open}
                disabled={locked}
                className={`min-w-0 flex-1 text-left text-base disabled:cursor-not-allowed ${wrapText}`}
                onClick={() => setOpenId(open ? null : sentence.id)}
              >
                {sentence.text}
              </button>
              {verdict && <span className="shrink-0 text-sm font-semibold text-ink">{copy.verdicts[verdict]}</span>}
            </div>
            {open && !locked && (
              <div className="grid grid-cols-3 gap-2">
                {VERDICTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={verdict === v}
                    disabled={busy}
                    className={`${buttonBase} px-1 ${optionButton(verdict === v)}`}
                    onClick={() => {
                      onJudge(sentence.id, v);
                      setOpenId(null);
                    }}
                  >
                    {copy.verdicts[v]}
                  </button>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Counts({ entries }: { entries: RaceEntry[] }) {
  const counts = useMemo(
    () => ({ human: entries.filter((e) => e.role === 'human').length, agent: entries.filter((e) => e.role === 'agent').length }),
    [entries],
  );
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-semibold">{copy.race.submittedCount}</span>
      {ROLES.map((role) => (
        <span key={role} data-testid={`race-count-${role}`}>
          {copy.roles[role]} <span className="font-semibold tabular-nums">{counts[role]}</span>
        </span>
      ))}
    </p>
  );
}

export function RaceReveal() {
  const { entries, loading, error } = useAllEntries<RaceEntry>('race');
  const key = usePrivateDoc<AnswerKey>('answerKey');
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const values = useMemo(() => entries.map((e) => ({ ...e.value, findings: e.value.findings ?? {} })), [entries]);

  async function reveal() {
    if (!key.data) return;
    setWriting(true);
    setWriteError(null);
    try {
      await publishRaceResults(aggregateRace(values, key.data));
      await setRevealed('race', true);
    } catch (err) {
      setWriteError(describeError(err));
    } finally {
      setWriting(false);
    }
  }

  const keyProblem = key.error ?? (!key.loading && !key.data ? ui.keyMissing : null);
  const ready = !loading && !error && !key.loading && !keyProblem;

  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-grid-soft p-3">
      {error && <LoadFailure message={error} />}
      {keyProblem && <LoadFailure message={keyProblem} />}
      {!error && (loading ? <LoadingBlock /> : <Counts entries={values} />)}
      <button type="button" className={primaryButton} disabled={!ready || writing} onClick={() => void reveal()}>
        {ui.reveal}
      </button>
      {writeError && (
        <p role="alert" className={`text-sm text-proof ${wrapText}`}>
          {copy.states.saveError}：{writeError}
        </p>
      )}
    </div>
  );
}

export default function Race({ isPresenter }: ActivityProps) {
  const { value, status, failed, error, save, retry } = useMyEntry<RaceEntry>('race');
  const release = usePrivateDoc<MockRelease>('mockRelease');
  const session = useLiveSession();
  const draft = useDraft<RaceEntry>(value, EMPTY, save);
  const busy = status === 'loading' || status === 'saving';

  if (failed === 'read') return <LoadFailure message={error ?? ''} />;
  if (status === 'loading' || release.loading) return <LoadingBlock />;
  if (release.error) return <LoadFailure message={release.error} />;
  if (!release.data || release.data.sentences.length === 0) return <LoadFailure message={ui.releaseMissing} />;
  if (session.loading) return <LoadingBlock />;

  const current = draft.value;
  const locked = current.role === null;
  const revealed = session.state?.revealed.race === true;

  function judge(sentenceId: string, verdict: Verdict) {
    draft.change({ ...current, findings: { ...current.findings, [sentenceId]: verdict } }, true);
  }

  return (
    <div className="flex flex-col gap-4">
      {session.error && <LoadFailure message={session.error} />}
      {isPresenter && !revealed && <RaceReveal />}
      <div className="flex flex-col gap-2">
        <p className="font-semibold">{copy.race.roleLabel}</p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              aria-pressed={current.role === role}
              disabled={busy}
              className={`${buttonBase} ${optionButton(current.role === role)}`}
              onClick={() => draft.change({ ...current, role }, true)}
            >
              {copy.roles[role]}
            </button>
          ))}
        </div>
        {locked && (
          <p role="status" data-testid="race-pick-role" className={`text-ink ${wrapText}`}>
            {copy.race.pickRoleFirst}
          </p>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">{copy.race.pairCodeLabel}</span>
        <span className="text-sm text-ink-muted">{copy.race.pairCodeHint}</span>
        <input
          type="text"
          maxLength={20}
          value={current.pairCode}
          className="w-full max-w-xs rounded-lg border-2 border-grid px-3 py-2"
          onChange={(e) => draft.change({ ...current, pairCode: e.target.value }, false)}
        />
      </label>
      <KitDownload />
      <h3 className={`text-lg font-bold ${wrapText}`}>{release.data.title}</h3>
      <p className="text-ink-muted">{copy.race.tapHint}</p>
      <SaveStatus status={status} failed={failed} error={error} hasValue={value !== null} onRetry={() => void retry()} />
      <SentenceList release={release.data} entry={current} busy={busy} locked={locked} onJudge={judge} />
    </div>
  );
}
