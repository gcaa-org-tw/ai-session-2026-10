import { copy } from '../content/copy';
import { ui } from '../content/ui';
import { useAllEntries, useNames } from '../entries/useEntries';
import { exportRows, toCsv } from '../lib/export';
import type { ScenarioEntry, WishEntry } from '../lib/types';
import { LoadFailure, primaryButton } from './ui';

const FILE_NAME = 'ai-session-export.csv';
const URL_LIFETIME_MS = 60_000;

export default function ExportCsv() {
  const wish = useAllEntries<WishEntry>('wishlist');
  const scenario = useAllEntries<ScenarioEntry>('scenario');
  const names = useNames();
  const error = wish.error ?? scenario.error ?? names.error;
  const loading = wish.loading || scenario.loading || names.loading;

  function download() {
    const csv = toCsv(exportRows(wish.entries, scenario.entries, names.names));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), URL_LIFETIME_MS);
  }

  if (error) return <LoadFailure message={error} />;

  return (
    <div className="flex items-center gap-3">
      <button type="button" className={primaryButton} disabled={loading} onClick={download}>
        {ui.exportCsv}
      </button>
      {loading && <span className="text-ink-muted">{copy.states.loading}</span>}
    </div>
  );
}
