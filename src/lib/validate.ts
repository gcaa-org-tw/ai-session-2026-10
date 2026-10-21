import type { AnswerKey, MockRelease } from './types';

export function validateAnswerKey(release: MockRelease, key: AnswerKey): string[] {
  const keyIds = Object.keys(key);
  if (keyIds.length === 0) return ['answer key is empty'];
  const releaseIds = new Set(release.sentences.map((s) => s.id));
  return keyIds
    .filter((id) => !releaseIds.has(id))
    .map((id) => `answer key id ${id} is not a sentence in the release`);
}
