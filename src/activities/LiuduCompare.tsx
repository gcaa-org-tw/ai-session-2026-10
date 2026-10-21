import { useState } from 'react';
import { copy } from '../content/copy';
import { wrapText } from './ui';

const labelClass = 'text-sm font-semibold text-slate-700';
const linkClass = `text-sm text-emerald-700 underline ${wrapText}`;

function StaticPanel() {
  const [failed, setFailed] = useState(false);
  const { staticLabel, imageAlt, imageSource, imageSourceUrl } = copy.liudu;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className={labelClass}>{staticLabel}</p>
      {failed ? (
        <p data-testid="liudu-image-error" className={`rounded-lg border border-slate-300 p-3 text-slate-600 ${wrapText}`}>
          {imageAlt}
        </p>
      ) : (
        <img
          src={`${import.meta.env.BASE_URL}liudu-static.png`}
          alt={imageAlt}
          className="h-auto w-full rounded-lg border border-slate-200"
          onError={() => setFailed(true)}
        />
      )}
      <a href={imageSourceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {imageSource}
      </a>
    </div>
  );
}

function InteractivePanel() {
  const { interactiveLabel, siteUrl, siteTitle, openSite } = copy.liudu;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className={labelClass}>{interactiveLabel}</p>
      <iframe
        src={siteUrl}
        title={siteTitle}
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups"
        className="h-[480px] w-full rounded-lg border border-slate-200"
      />
      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {openSite}
      </a>
    </div>
  );
}

export default function LiuduCompare() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StaticPanel />
      <InteractivePanel />
    </div>
  );
}
