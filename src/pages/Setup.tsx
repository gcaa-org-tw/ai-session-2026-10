import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { copy } from '../content/copy';
import type { SetupStep } from '../content/copy';
import ExternalLink from './ExternalLink';

const URL_PATTERN = /(https:\/\/[A-Za-z0-9\-._~:/?#@!$&*+=%]*[A-Za-z0-9\-_~/#=%])/g;

function linkify(text: string): ReactNode {
  return text.split(URL_PATTERN).map((part, index) =>
    index % 2 === 1 ? <ExternalLink key={index} href={part} /> : <Fragment key={index}>{part}</Fragment>,
  );
}

function StepExtra({ extra }: { extra: SetupStep['extra'] }) {
  const { deckUrl, meetUrl, meetPending } = copy.setup;
  if (extra === 'deck') {
    return (
      <p className="text-base leading-relaxed text-slate-700" data-testid="setup-deck-link">
        <ExternalLink href={deckUrl} />
      </p>
    );
  }
  if (extra === 'meet') {
    return (
      <p className="text-base leading-relaxed text-slate-700" data-testid="setup-meet">
        {meetUrl === '' ? meetPending : <ExternalLink href={meetUrl} />}
      </p>
    );
  }
  return null;
}

export default function Setup() {
  const { title, intro, steps } = copy.setup;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow sm:p-8">
        <h1 className="mb-3 break-words text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mb-6 text-base leading-relaxed text-slate-700">{intro}</p>
        <ol className="list-decimal space-y-6 pl-6 marker:font-semibold marker:text-emerald-700">
          {steps.map((step, index) => (
            <li key={step.title} className="pl-1" data-testid={`setup-step-${index}`}>
              <h2 className="mb-2 break-words text-lg font-semibold text-slate-900" data-testid="setup-step-title">
                {step.title}
              </h2>
              <div className="space-y-2">
                {step.body.map((paragraph) => (
                  <p key={paragraph} className="break-words text-base leading-relaxed text-slate-700">
                    {linkify(paragraph)}
                  </p>
                ))}
                <StepExtra extra={step.extra} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
