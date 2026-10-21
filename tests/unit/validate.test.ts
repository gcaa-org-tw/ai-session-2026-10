import { describe, expect, test } from 'vitest';
import { validateAnswerKey } from '../../src/lib/validate';
import type { AnswerKey, MockRelease } from '../../src/lib/types';

const release: MockRelease = {
  title: 't',
  sentences: [
    { id: 's1', text: 'a' },
    { id: 's2', text: 'b' },
  ],
};

describe('validateAnswerKey', () => {
  test('valid key has no problems', () => {
    const key: AnswerKey = { s2: { verdict: 'mismatch', explanation: 'x' } };
    expect(validateAnswerKey(release, key)).toEqual([]);
  });
  test('reports a key id missing from the release', () => {
    const key: AnswerKey = { s9: { verdict: 'mismatch', explanation: 'x' } };
    const problems = validateAnswerKey(release, key);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('s9');
  });
  test('reports an empty key', () => {
    expect(validateAnswerKey(release, {})).toHaveLength(1);
  });
});
