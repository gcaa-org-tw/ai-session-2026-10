import type {
  AnswerKey,
  Bin,
  HabitsEntry,
  RaceEntry,
  RaceResults,
  Role,
  RoleScore,
  Verdict,
  WarmMark,
  WarmupEntry,
  WishBin,
  WishItem,
} from './types';

export function aggregateWarmup(entries: WarmupEntry[], typeIds: string[]): Record<string, Record<WarmMark, number>> {
  const result: Record<string, Record<WarmMark, number>> = {};
  for (const id of typeIds) {
    const counts: Record<WarmMark, number> = { using: 0, worse: 0, none: 0 };
    for (const entry of entries) {
      const mark = entry.marks[id];
      if (mark) counts[mark] += 1;
    }
    result[id] = counts;
  }
  return result;
}

export function aggregateHabits(entries: HabitsEntry[], cardIds: string[]): Record<string, Record<Bin, number>> {
  const result: Record<string, Record<Bin, number>> = {};
  for (const id of cardIds) {
    const counts: Record<Bin, number> = { outdated: 0, useful: 0, new: 0 };
    for (const entry of entries) {
      const bin = entry.placements[id];
      if (bin) counts[bin] += 1;
    }
    result[id] = counts;
  }
  return result;
}

export function triageBin(i: Pick<WishItem, 'repeats' | 'rulesWritable' | 'sourceCheckable'>): WishBin {
  if (!i.rulesWritable || !i.sourceCheckable) return 'learn';
  return i.repeats ? 'build' : 'now';
}

function isFlag(verdict: Verdict | undefined): boolean {
  return verdict === 'mismatch' || verdict === 'nosource';
}

export function scoreFindings(
  findings: Record<string, Verdict>,
  key: AnswerKey,
): { caught: string[]; missed: string[]; falseAlarms: string[] } {
  const keyIds = Object.keys(key);
  return {
    caught: keyIds.filter((id) => isFlag(findings[id])),
    missed: keyIds.filter((id) => !isFlag(findings[id])),
    falseAlarms: Object.keys(findings).filter((id) => isFlag(findings[id]) && !(id in key)),
  };
}

function scoreRole(entries: RaceEntry[], role: Role, key: AnswerKey): RoleScore {
  const mine = entries.filter((e) => e.role === role);
  const perSentence: Record<string, number> = {};
  for (const id of Object.keys(key)) perSentence[id] = 0;
  let caught = 0;
  let missed = 0;
  let falseAlarms = 0;
  for (const entry of mine) {
    const score = scoreFindings(entry.findings, key);
    caught += score.caught.length;
    missed += score.missed.length;
    falseAlarms += score.falseAlarms.length;
    for (const id of score.caught) perSentence[id] = (perSentence[id] ?? 0) + 1;
  }
  const n = mine.length;
  return {
    entries: n,
    caughtAvg: n === 0 ? 0 : caught / n,
    missedAvg: n === 0 ? 0 : missed / n,
    falseAlarmsAvg: n === 0 ? 0 : falseAlarms / n,
    perSentence,
  };
}

export function aggregateRace(entries: RaceEntry[], key: AnswerKey): RaceResults {
  const explanations: Record<string, string> = {};
  for (const [id, item] of Object.entries(key)) explanations[id] = item.explanation;
  return {
    human: scoreRole(entries, 'human', key),
    agent: scoreRole(entries, 'agent', key),
    planted: Object.keys(key),
    explanations,
  };
}
