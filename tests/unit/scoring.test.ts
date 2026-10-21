import { describe, expect, test } from 'vitest';
import { aggregateHabits, aggregateRace, aggregateWarmup, scoreFindings, triageBin } from '../../src/lib/scoring';
import type { AnswerKey, HabitsEntry, RaceEntry, WarmupEntry } from '../../src/lib/types';

describe('triageBin', () => {
  test('repeating, writable, checkable goes to build', () =>
    expect(triageBin({ repeats: true, rulesWritable: true, sourceCheckable: true })).toBe('build'));
  test('one-off, writable, checkable goes to now', () =>
    expect(triageBin({ repeats: false, rulesWritable: true, sourceCheckable: true })).toBe('now'));
  test('rules not writable goes to learn', () =>
    expect(triageBin({ repeats: true, rulesWritable: false, sourceCheckable: true })).toBe('learn'));
  test('source not checkable goes to learn', () =>
    expect(triageBin({ repeats: true, rulesWritable: true, sourceCheckable: false })).toBe('learn'));
});

const key: AnswerKey = {
  s2: { verdict: 'mismatch', explanation: 'e2' },
  s5: { verdict: 'nosource', explanation: 'e5' },
};

describe('scoreFindings', () => {
  test('splits caught, missed and false alarms', () => {
    const result = scoreFindings({ s2: 'mismatch', s3: 'nosource', s5: 'match' }, key);
    expect(result).toEqual({ caught: ['s2'], missed: ['s5'], falseAlarms: ['s3'] });
  });
  test('a key sentence with no finding is missed', () => {
    expect(scoreFindings({}, key)).toEqual({ caught: [], missed: ['s2', 's5'], falseAlarms: [] });
  });
  test('either flag verdict catches a key sentence', () => {
    expect(scoreFindings({ s2: 'nosource', s5: 'mismatch' }, key).caught).toEqual(['s2', 's5']);
  });
  test('match on a non-key sentence is not a false alarm', () => {
    expect(scoreFindings({ s1: 'match' }, key).falseAlarms).toEqual([]);
  });
});

describe('aggregateRace', () => {
  const entries: RaceEntry[] = [
    { role: 'human', pairCode: 'a', findings: { s2: 'mismatch', s5: 'match', s3: 'mismatch' } },
    { role: 'human', pairCode: 'b', findings: { s2: 'nosource', s5: 'nosource' } },
    { role: 'agent', pairCode: 'a', findings: { s2: 'mismatch', s5: 'nosource', s3: 'nosource', s4: 'mismatch' } },
  ];
  const results = aggregateRace(entries, key);

  test('averages per role', () => {
    expect(results.human).toEqual({
      entries: 2,
      caughtAvg: 1.5,
      missedAvg: 0.5,
      falseAlarmsAvg: 0.5,
      perSentence: { s2: 2, s5: 1 },
    });
    expect(results.agent).toEqual({
      entries: 1,
      caughtAvg: 2,
      missedAvg: 0,
      falseAlarmsAvg: 2,
      perSentence: { s2: 1, s5: 1 },
    });
  });
  test('lists planted ids in key order and explanations', () => {
    expect(results.planted).toEqual(['s2', 's5']);
    expect(results.explanations).toEqual({ s2: 'e2', s5: 'e5' });
  });
  test('role with no entries has zero averages and zero counts', () => {
    const only = aggregateRace([entries[2] as RaceEntry], key);
    expect(only.human).toEqual({ entries: 0, caughtAvg: 0, missedAvg: 0, falseAlarmsAvg: 0, perSentence: { s2: 0, s5: 0 } });
  });
});

describe('aggregateHabits', () => {
  const entries: HabitsEntry[] = [
    { placements: { c1: 'outdated', c2: 'useful' } },
    { placements: { c1: 'outdated', c2: 'new' } },
    { placements: { c1: 'new' } },
  ];
  test('counts placements per card', () => {
    const result = aggregateHabits(entries, ['c1', 'c2', 'c3']);
    expect(result.c1).toEqual({ outdated: 2, useful: 0, new: 1 });
    expect(result.c2).toEqual({ outdated: 0, useful: 1, new: 1 });
  });
  test('cards nobody placed return zeros', () => {
    expect(aggregateHabits(entries, ['c3']).c3).toEqual({ outdated: 0, useful: 0, new: 0 });
  });
  test('ignores placements for unknown cards', () => {
    expect(Object.keys(aggregateHabits(entries, ['c1']))).toEqual(['c1']);
  });
});

describe('aggregateWarmup', () => {
  test('zero entries gives all-zero records per type id', () => {
    expect(aggregateWarmup([], ['t1', 't2'])).toEqual({
      t1: { using: 0, worse: 0, none: 0 },
      t2: { using: 0, worse: 0, none: 0 },
    });
  });
  test('counts marks per type id', () => {
    const entries: WarmupEntry[] = [
      { marks: { t1: 'using', t2: 'none' }, note: '' },
      { marks: { t1: 'using' }, note: 'x' },
      { marks: { t1: 'worse' }, note: '' },
    ];
    const result = aggregateWarmup(entries, ['t1', 't2']);
    expect(result.t1).toEqual({ using: 2, worse: 1, none: 0 });
    expect(result.t2).toEqual({ using: 0, worse: 0, none: 1 });
  });
});
