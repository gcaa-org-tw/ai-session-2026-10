import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { validateAnswerKey } from '../src/lib/validate';
import type { AnswerKey, MockRelease } from '../src/lib/types';

function readJson<T>(dir: string, name: string): T | string {
  try {
    return JSON.parse(readFileSync(join(dir, name), 'utf-8')) as T;
  } catch (error) {
    return `${name}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const dir = process.argv[2];
if (!dir) {
  console.error('usage: check-private <private-content-dir>');
  process.exit(1);
}

const release = readJson<MockRelease>(dir, 'mock-release.json');
const key = readJson<AnswerKey>(dir, 'answer-key.json');
const problems: string[] = [];
if (typeof release === 'string') problems.push(release);
if (typeof key === 'string') problems.push(key);
if (typeof release !== 'string' && typeof key !== 'string') problems.push(...validateAnswerKey(release, key));

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log(`ok: ${Object.keys(key as AnswerKey).length} key sentences validated against ${(release as MockRelease).sentences.length} release sentences`);
