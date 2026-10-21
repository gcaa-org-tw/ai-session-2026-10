import { copy } from '../content/copy';
import type { ToolItem } from '../content/copy';
import ExternalLink from './ExternalLink';

function Source({ item }: { item: ToolItem }) {
  if (item.source !== '') {
    return (
      <p className="text-base leading-relaxed" data-testid="tool-source">
        <ExternalLink href={item.source} />
      </p>
    );
  }
  return (
    <p className="break-words text-base leading-relaxed text-slate-700" data-testid="tool-source">
      {item.sourceLabel}
    </p>
  );
}

export default function Tools() {
  const { title, intro, howTo, groups } = copy.tools;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl bg-white p-5 shadow sm:p-8">
        <header className="flex flex-col gap-3">
          <h1 className="break-words text-2xl font-bold text-slate-900">{title}</h1>
          <p className="break-words text-base leading-relaxed text-slate-700">{intro}</p>
        </header>
        {howTo.map((block) => (
          <section key={block.heading} className="flex flex-col gap-2" data-testid="tools-howto">
            <h2 className="break-words text-lg font-semibold text-slate-900">{block.heading}</h2>
            {block.body.map((line) => (
              <p key={line} className="break-words text-base leading-relaxed text-slate-700">
                {line}
              </p>
            ))}
          </section>
        ))}
        {groups.map((group) => (
          <section key={group.heading} className="flex flex-col gap-4" data-testid="tools-group">
            <h2 className="break-words text-lg font-semibold text-slate-900">{group.heading}</h2>
            <ul className="flex flex-col gap-4">
              {group.items.map((item) => (
                <li key={item.name} className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3" data-testid="tool-item">
                  <h3 className="break-words text-base font-semibold text-slate-900">{item.name}</h3>
                  <p className="break-words text-base leading-relaxed text-slate-700">{item.what}</p>
                  <Source item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
