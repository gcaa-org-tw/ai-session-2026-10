import { copy } from '../content/copy';
import type { MockRelease, RaceResults, Role, RoleScore } from '../lib/types';
import { usePrivateDoc } from '../private/usePrivateDoc';
import { useLiveSession } from '../session/useLiveSession';
import { RaceReveal } from './Race';
import { useRaceResults } from './raceHooks';
import type { ActivityProps } from './types';
import { EmptyNote, LoadFailure, LoadingBlock, wrapText } from './ui';

const ROLES: Role[] = ['human', 'agent'];
const AVERAGES = ['caught', 'missed', 'falseAlarms'] as const;
const AVERAGE_FIELD = { caught: 'caughtAvg', missed: 'missedAvg', falseAlarms: 'falseAlarmsAvg' } as const;

function format(n: number): string {
  return n.toFixed(1);
}

function Averages({ results }: { results: RaceResults }) {
  return (
    <table className="w-full table-fixed border-collapse text-center">
      <caption className="mb-2 text-left font-semibold">{copy.race.averagePerEntry}</caption>
      <thead>
        <tr className="text-sm text-slate-600">
          <th scope="col" className="w-1/4 p-1 text-left font-normal" />
          <th scope="col" className="p-1 font-normal">{copy.race.submittedCount}</th>
          {AVERAGES.map((field) => (
            <th key={field} scope="col" className="p-1 font-normal">
              {copy.race[field]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROLES.map((role) => {
          const score: RoleScore = results[role];
          return (
            <tr key={role} className="border-t border-slate-200">
              <th scope="row" className={`p-1 text-left font-semibold ${wrapText}`}>
                {copy.roles[role]}
              </th>
              <td data-testid={`race-entries-${role}`} className="p-1 tabular-nums">
                {score.entries}
              </td>
              {AVERAGES.map((field) => (
                <td key={field} data-testid={`race-avg-${role}-${field}`} className="p-1 tabular-nums">
                  {format(score[AVERAGE_FIELD[field]])}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Planted({ results, release }: { results: RaceResults; release: MockRelease | null }) {
  const texts = new Map((release?.sentences ?? []).map((s) => [s.id, s.text]));
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">{copy.race.perSentence}</h3>
      <ul className="flex flex-col gap-3">
        {results.planted.map((id) => (
          <li key={id} data-testid={`race-planted-${id}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
            <p className={`font-semibold ${wrapText}`}>{texts.get(id) ?? id}</p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              {ROLES.map((role) => (
                <span key={role}>
                  {copy.roles[role]}{' '}
                  <span data-testid={`race-caught-${role}`} className="font-semibold tabular-nums">
                    {results[role].perSentence[id] ?? 0}
                  </span>
                </span>
              ))}
            </p>
            <p className={`text-slate-700 ${wrapText}`}>
              <span className="font-semibold">{copy.race.explanation}</span>：{results.explanations[id] ?? ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Results() {
  const results = useRaceResults();
  const release = usePrivateDoc<MockRelease>('mockRelease');

  if (results.error) return <LoadFailure message={results.error} />;
  if (results.loading) return <LoadingBlock />;
  const data = results.data;
  if (!data || data.human.entries + data.agent.entries === 0) return <EmptyNote />;

  return (
    <div className="flex flex-col gap-5">
      {release.error && <LoadFailure message={release.error} />}
      <Averages results={data} />
      <Planted results={data} release={release.data} />
    </div>
  );
}

export default function RaceBoard({ isPresenter }: ActivityProps) {
  const session = useLiveSession();

  if (session.error) return <LoadFailure message={session.error} />;
  if (session.loading) return <LoadingBlock />;
  const revealed = session.state?.revealed.race === true;

  return (
    <div data-testid="race-board" className="flex min-w-0 flex-col gap-4">
      {isPresenter && !revealed && <RaceReveal />}
      {revealed ? <Results /> : <p>{copy.race.waitingReveal}</p>}
    </div>
  );
}
