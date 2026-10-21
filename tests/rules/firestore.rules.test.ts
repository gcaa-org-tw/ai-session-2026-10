import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PRESENTER_UID = 'mPxi76Tc4HWN5q6bwqqXy76chfj2';
const PRESENTER_EMAIL = 'presenter@gcaa.org.tw';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ai-session',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

function as(uid: string, email: string, verified = true) {
  return env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
}

const colleague = () => as('u1', 'a@gcaa.org.tw');
const presenter = () => as(PRESENTER_UID, PRESENTER_EMAIL);

describe('access gate', () => {
  it('denies a stranger reading session/live', async () => {
    await assertFails(getDoc(doc(as('x1', 'stranger@gmail.com'), 'session/live')));
  });

  it('denies a signed-out visitor reading session/live', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'session/live')));
  });

  it('denies an unverified gcaa address reading session/live', async () => {
    await assertFails(getDoc(doc(as('u9', 'a@gcaa.org.tw', false), 'session/live')));
  });

  it('denies a lookalike domain', async () => {
    await assertFails(getDoc(doc(as('x2', 'a@gcaa.org.tw.evil.com'), 'session/live')));
    await assertFails(getDoc(doc(as('x3', 'a@notgcaa.org.tw'), 'session/live')));
    await assertFails(getDoc(doc(as('x4', 'a@mail.gcaa.org.tw'), 'session/live')));
  });

  it('allows an upper-case gcaa address', async () => {
    await assertSucceeds(getDoc(doc(as('u2', 'A@GCAA.ORG.TW'), 'session/live')));
  });

  it('treats the presenter uid as presenter whatever the address case', async () => {
    const db = as(PRESENTER_UID, 'PRESENTER@GCAA.ORG.TW');
    await assertSucceeds(setDoc(doc(db, 'session/live'), { slideIndex: 1 }));
    await assertSucceeds(getDoc(doc(db, 'private/notes')));
  });

  it('does not treat the presenter address under another uid as presenter', async () => {
    const db = as('p2', PRESENTER_EMAIL);
    await assertFails(getDoc(doc(db, 'private/notes')));
    await assertFails(setDoc(doc(db, 'session/live'), { slideIndex: 1 }));
  });

  it('denies an unverified presenter uid', async () => {
    const db = as(PRESENTER_UID, PRESENTER_EMAIL, false);
    await assertFails(getDoc(doc(db, 'private/notes')));
    await assertFails(setDoc(doc(db, 'session/live'), { slideIndex: 1 }));
  });

  it('denies the presenter uid on a non-gcaa address', async () => {
    const db = as(PRESENTER_UID, 'presenter@gmail.com');
    await assertFails(getDoc(doc(db, 'private/notes')));
    await assertFails(setDoc(doc(db, 'session/live'), { slideIndex: 1 }));
  });
});

describe('colleague access', () => {
  it.each(['session/live', 'private/mockRelease', 'private/kit'])(
    'reads %s',
    async (path) => {
      await assertSucceeds(getDoc(doc(colleague(), path)));
    },
  );

  it.each(['private/notes', 'private/answerKey'])('cannot read %s', async (path) => {
    await assertFails(getDoc(doc(colleague(), path)));
  });

  it.each([
    'session/live',
    'public/raceResults',
    'private/mockRelease',
    'private/kit',
    'private/notes',
    'private/answerKey',
  ])('cannot write %s', async (path) => {
    await assertFails(setDoc(doc(colleague(), path), { x: 1 }));
  });
});

describe('race results reveal gate', () => {
  async function seedSession(data: Record<string, unknown> | null) {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'public/raceResults'), { planted: ['s2'] });
      if (data) await setDoc(doc(db, 'session/live'), data);
    });
  }

  it('denies a colleague before the reveal flag is set', async () => {
    await seedSession({ slideIndex: 0, revealed: { race: false } });
    await assertFails(getDoc(doc(colleague(), 'public/raceResults')));
  });

  it('denies a colleague when the session has no race flag', async () => {
    await seedSession({ slideIndex: 0, revealed: { habits: true } });
    await assertFails(getDoc(doc(colleague(), 'public/raceResults')));
  });

  it('denies a colleague when there is no session document', async () => {
    await seedSession(null);
    await assertFails(getDoc(doc(colleague(), 'public/raceResults')));
  });

  it('allows a colleague after the reveal flag is set', async () => {
    await seedSession({ slideIndex: 0, revealed: { race: true } });
    await assertSucceeds(getDoc(doc(colleague(), 'public/raceResults')));
  });

  it('denies a stranger and an unverified user even after the reveal', async () => {
    await seedSession({ slideIndex: 0, revealed: { race: true } });
    await assertFails(getDoc(doc(as('x1', 'stranger@gmail.com'), 'public/raceResults')));
    await assertFails(getDoc(doc(as('u9', 'a@gcaa.org.tw', false), 'public/raceResults')));
  });

  it('lets the presenter read before the reveal and without a session document', async () => {
    await seedSession({ slideIndex: 0, revealed: { race: false } });
    await assertSucceeds(getDoc(doc(presenter(), 'public/raceResults')));
    await seedSession(null);
    await assertSucceeds(getDoc(doc(presenter(), 'public/raceResults')));
  });
});

describe('entries', () => {
  it('writes own entry', async () => {
    await assertSucceeds(setDoc(doc(colleague(), 'entries/habits/users/u1'), { value: {} }));
  });

  it('cannot write another user entry', async () => {
    await assertFails(setDoc(doc(colleague(), 'entries/habits/users/u2'), { value: {} }));
  });

  it('reads another user entry', async () => {
    await assertSucceeds(getDoc(doc(colleague(), 'entries/habits/users/u2')));
  });

  it.each(['warmup', 'habits', 'wishlist', 'race', 'scenario'])(
    'accepts activity %s',
    async (activityId) => {
      await assertSucceeds(setDoc(doc(colleague(), `entries/${activityId}/users/u1`), { value: {} }));
    },
  );

  it('rejects an unknown activity id', async () => {
    await assertFails(setDoc(doc(colleague(), 'entries/bogus/users/u1'), { value: {} }));
    await assertFails(getDoc(doc(colleague(), 'entries/bogus/users/u1')));
  });

  it('denies a stranger writing an entry under their own uid', async () => {
    await assertFails(setDoc(doc(as('x1', 'stranger@gmail.com'), 'entries/habits/users/x1'), { value: {} }));
  });

  it('denies an unverified user writing an entry under their own uid', async () => {
    await assertFails(
      setDoc(doc(as('u1', 'a@gcaa.org.tw', false), 'entries/habits/users/u1'), { value: {} }),
    );
  });
});

describe('names', () => {
  it('writes own name', async () => {
    await assertSucceeds(setDoc(doc(colleague(), 'names/u1'), { displayName: 'A' }));
  });

  it('cannot write another user name', async () => {
    await assertFails(setDoc(doc(colleague(), 'names/u2'), { displayName: 'B' }));
  });

  it('cannot read own or another name', async () => {
    await assertFails(getDoc(doc(colleague(), 'names/u1')));
    await assertFails(getDoc(doc(colleague(), 'names/u2')));
  });

  it('lets the presenter read a name', async () => {
    await assertSucceeds(getDoc(doc(presenter(), 'names/u1')));
  });
});

describe('presenter', () => {
  it.each([
    'session/live',
    'public/raceResults',
    'private/mockRelease',
    'private/kit',
    'private/notes',
    'private/answerKey',
  ])('reads and writes %s', async (path) => {
    await assertSucceeds(setDoc(doc(presenter(), path), { x: 1 }));
    await assertSucceeds(getDoc(doc(presenter(), path)));
  });

  it('reads any entry and any name', async () => {
    await assertSucceeds(getDoc(doc(presenter(), 'entries/habits/users/u2')));
    await assertSucceeds(getDoc(doc(presenter(), 'names/u2')));
  });

  it('cannot write another user entry or name', async () => {
    await assertFails(setDoc(doc(presenter(), 'entries/habits/users/u2'), { value: {} }));
    await assertFails(setDoc(doc(presenter(), 'names/u2'), { displayName: 'B' }));
  });

  it('writes own entry and name', async () => {
    await assertSucceeds(setDoc(doc(presenter(), `entries/habits/users/${PRESENTER_UID}`), { value: {} }));
    await assertSucceeds(setDoc(doc(presenter(), `names/${PRESENTER_UID}`), { displayName: 'P' }));
  });

  it('is denied an unknown path', async () => {
    await assertFails(getDoc(doc(presenter(), 'foo/bar')));
    await assertFails(setDoc(doc(presenter(), 'foo/bar'), { x: 1 }));
  });
});
