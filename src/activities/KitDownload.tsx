import { useState } from 'react';
import JSZip from 'jszip';
import { describeError } from '../auth/useAuth';
import { copy } from '../content/copy';
import { ui } from '../content/ui';
import type { KitDoc } from '../lib/privateFiles';
import { usePrivateDoc } from '../private/usePrivateDoc';
import { LoadingBlock, primaryButton, wrapText } from './ui';

const KIT_URL_LIFETIME_MS = 60_000;

async function downloadKit(files: Record<string, string>): Promise<void> {
  const zip = new JSZip();
  for (const [path, text] of Object.entries(files)) zip.file(path, text);
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = ui.kitFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), KIT_URL_LIFETIME_MS);
}

export default function KitDownload() {
  const kit = usePrivateDoc<KitDoc>('kit');
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const files = kit.data?.files ?? null;

  let problem = kit.error ?? buildError;
  if (!problem && !kit.loading && !files) problem = ui.kitMissing;

  async function build() {
    if (!files) return;
    setBuilding(true);
    setBuildError(null);
    try {
      await downloadKit(files);
    } catch (err) {
      setBuildError(describeError(err));
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" className={primaryButton} disabled={building || kit.loading || !files} onClick={() => void build()}>
        {copy.race.downloadKit}
      </button>
      {(kit.loading || building) && <LoadingBlock />}
      {problem && (
        <p role="alert" data-testid="kit-error" className={`text-sm text-proof ${wrapText}`}>
          {copy.race.downloadKit}：{problem}
        </p>
      )}
    </div>
  );
}
