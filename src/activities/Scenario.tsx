import { useMemo } from 'react';
import { copy } from '../content/copy';
import { useAllEntries, useMyEntry } from '../entries/useEntries';
import type { ScenarioEntry } from '../lib/types';
import ExportCsv from './ExportCsv';
import { useDraft, useNameOptIn } from './hooks';
import type { ActivityProps } from './types';
import { BoardFrame, LoadFailure, LoadingBlock, NameError, SaveStatus, wrapText } from './ui';

const EMPTY: ScenarioEntry = { what: '', files: '', gain: '', optInName: false };
const FIELDS = ['what', 'files', 'gain'] as const;

function Board() {
  const { entries, loading, error } = useAllEntries<ScenarioEntry>('scenario');
  const whats = useMemo(() => entries.map((e) => e.value.what).filter((w) => w.trim() !== ''), [entries]);
  return (
    <BoardFrame testId="scenario-board" loading={loading} error={error} empty={whats.length === 0}>
      <ul className="flex flex-col">
        {whats.map((what, i) => (
          <li key={i} className={`border-t border-dashed border-grid-soft py-2 first:border-t-0 ${wrapText}`}>
            {what}
          </li>
        ))}
      </ul>
    </BoardFrame>
  );
}

export default function Scenario({ isPresenter }: ActivityProps) {
  const { value, status, failed, error, save, retry } = useMyEntry<ScenarioEntry>('scenario');
  const name = useNameOptIn();
  const draft = useDraft<ScenarioEntry>(value, EMPTY, save);

  if (failed === 'read') return <LoadFailure message={error ?? ''} />;
  if (status === 'loading') return <LoadingBlock />;

  const current = draft.value;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {FIELDS.map((field) => (
          <label key={field} className="flex flex-col gap-1">
            <span className={`font-semibold ${wrapText}`}>{copy.scenarioPrompts[field]}</span>
            <textarea
              rows={2}
              value={current[field]}
              className="w-full rounded-lg border-2 border-grid px-3 py-2"
              onChange={(e) => draft.change({ ...current, [field]: e.target.value }, false)}
            />
          </label>
        ))}
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={current.optInName}
            className="mt-1 h-5 w-5"
            onChange={(e) => {
              draft.change({ ...current, optInName: e.target.checked }, true);
              if (e.target.checked) void name.remember();
            }}
          />
          <span className={wrapText}>{copy.optInLabel}</span>
        </label>
      </div>
      <SaveStatus status={status} failed={failed} error={error} hasValue={value !== null} onRetry={() => void retry()} />
      <NameError error={name.error} busy={name.busy} onRetry={() => void name.remember()} />
      <div className="flex flex-col gap-2">
        <h3 className={`font-semibold ${wrapText}`}>{copy.scenarioBoardTitle}</h3>
        <Board />
      </div>
      {isPresenter && <ExportCsv />}
    </div>
  );
}
