import { describe, expect, test } from 'vitest';
import { isAllowedUser, isPresenter, PRESENTER_UID } from '../../src/lib/access';

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
  test('presenter uid with a verified gcaa address', () => expect(isPresenter(PRESENTER_UID, 'p@gcaa.org.tw', true)).toBe(true));
  test('presenter uid ignores address case', () => expect(isPresenter(PRESENTER_UID, 'P@GCAA.ORG.TW', true)).toBe(true));
  test('another uid is not presenter whatever the address', () => expect(isPresenter('someone-else', 'p@gcaa.org.tw', true)).toBe(false));
  test('unverified presenter rejected', () => expect(isPresenter(PRESENTER_UID, 'p@gcaa.org.tw', false)).toBe(false));
  test('presenter uid on a non-gcaa address rejected', () => expect(isPresenter(PRESENTER_UID, 'p@gmail.com', true)).toBe(false));
  test('missing uid rejected', () => {
    expect(isPresenter(null, 'p@gcaa.org.tw', true)).toBe(false);
    expect(isPresenter(undefined, 'p@gcaa.org.tw', true)).toBe(false);
  });
  test('exports the presenter uid', () => expect(PRESENTER_UID).toBe('mPxi76Tc4HWN5q6bwqqXy76chfj2'));
});
