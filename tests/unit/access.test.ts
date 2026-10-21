import { describe, expect, test } from 'vitest';
import { isAllowedUser, isPresenter, PRESENTER_EMAIL } from '../../src/lib/access';

describe('isAllowedUser', () => {
  test('allows verified gcaa address', () => expect(isAllowedUser('a@gcaa.org.tw', true)).toBe(true));
  test('rejects unverified', () => expect(isAllowedUser('a@gcaa.org.tw', false)).toBe(false));
  test('rejects personal gmail', () => expect(isAllowedUser('a@gmail.com', true)).toBe(false));
  test('rejects lookalike domain', () => expect(isAllowedUser('a@gcaa.org.tw.evil.com', true)).toBe(false));
  test('rejects subdomain trick', () => expect(isAllowedUser('a@xgcaa.org.tw', true)).toBe(false));
  test('is case-insensitive', () => expect(isAllowedUser('A@GCAA.ORG.TW', true)).toBe(true));
  test('null email', () => expect(isAllowedUser(null, true)).toBe(false));
  test('undefined email', () => expect(isAllowedUser(undefined, true)).toBe(false));
});

describe('isPresenter', () => {
  test('presenter exact', () => expect(isPresenter('presenter@example.com', true)).toBe(true));
  test('presenter is case-insensitive', () => expect(isPresenter('PRESENTER@EXAMPLE.COM', true)).toBe(true));
  test('other staff not presenter', () => expect(isPresenter('b@gcaa.org.tw', true)).toBe(false));
  test('unverified presenter rejected', () => expect(isPresenter('presenter@example.com', false)).toBe(false));
  test('exports the presenter address', () => expect(PRESENTER_EMAIL).toBe('presenter@example.com'));
});
