import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { MAX_KIT_BYTES, parseAnswerKey, parseKit, parseMockRelease, parseNotes } from '../../src/lib/privateFiles';

describe('parseMockRelease', () => {
  it('accepts a release', () => {
    const r = { title: 't', sentences: [{ id: 'a', text: 'x' }] };
    expect(parseMockRelease(JSON.stringify(r))).toEqual(r);
  });
  it('rejects bad JSON and bad shape', () => {
    expect(() => parseMockRelease('{oops')).toThrow('JSON');
    expect(() => parseMockRelease('{"title":"t"}')).toThrow('sentences');
    expect(() => parseMockRelease('{"title":"t","sentences":[{"id":1,"text":"x"}]}')).toThrow('id');
  });
});

describe('parseAnswerKey', () => {
  it('accepts a key', () => {
    const k = { a: { verdict: 'mismatch', explanation: 'e' } };
    expect(parseAnswerKey(JSON.stringify(k))).toEqual(k);
  });
  it('rejects a match verdict and missing explanation', () => {
    expect(() => parseAnswerKey('{"a":{"verdict":"match","explanation":"e"}}')).toThrow('a');
    expect(() => parseAnswerKey('{"a":{"verdict":"nosource"}}')).toThrow('explanation');
    expect(() => parseAnswerKey('[]')).toThrow();
  });
});

describe('parseNotes', () => {
  it('accepts a string map and rejects other values', () => {
    expect(parseNotes('{"a":"x"}')).toEqual({ a: 'x' });
    expect(() => parseNotes('{"a":1}')).toThrow('a');
    expect(() => parseNotes('"x"')).toThrow();
  });
});

describe('parseKit', () => {
  async function zipOf(build: (z: JSZip) => void): Promise<ArrayBuffer> {
    const z = new JSZip();
    build(z);
    return z.generateAsync({ type: 'arraybuffer' });
  }

  it('keeps dot-folder paths and UTF-8 text, skips directories and macOS junk', async () => {
    const buf = await zipOf((z) => {
      z.file('.agents/skills/fact-check/SKILL.md', '查核');
      z.file('六都簽署名單.csv', 'a,b');
      z.folder('empty');
      z.file('__MACOSX/._x', 'junk');
      z.file('sub/.DS_Store', 'junk');
    });
    expect(await parseKit(buf)).toEqual({
      files: { '.agents/skills/fact-check/SKILL.md': '查核', '六都簽署名單.csv': 'a,b' },
    });
  });
  it('strips a single top-level folder, ignoring macOS junk', async () => {
    const buf = await zipOf((z) => {
      z.file('kit/AGENTS.md', 'a');
      z.file('kit/.agents/skills/x/SKILL.md', 'b');
      z.file('__MACOSX/kit/._AGENTS.md', 'junk');
      z.file('kit/.DS_Store', 'junk');
    });
    expect(await parseKit(buf)).toEqual({ files: { 'AGENTS.md': 'a', '.agents/skills/x/SKILL.md': 'b' } });
  });
  it('strips nothing when the top level holds more than one folder', async () => {
    const buf = await zipOf((z) => {
      z.file('kit/AGENTS.md', 'a');
      z.file('data/list.csv', 'b');
    });
    expect(await parseKit(buf)).toEqual({ files: { 'kit/AGENTS.md': 'a', 'data/list.csv': 'b' } });
  });
  it('strips nothing when a file sits at the top level next to a folder', async () => {
    const buf = await zipOf((z) => {
      z.file('AGENTS.md', 'a');
      z.file('kit/x.md', 'b');
    });
    expect(await parseKit(buf)).toEqual({ files: { 'AGENTS.md': 'a', 'kit/x.md': 'b' } });
  });
  it('rejects non-zip, empty zip and oversized kits', async () => {
    await expect(parseKit(new TextEncoder().encode('nope').buffer)).rejects.toThrow('zip');
    await expect(parseKit(await zipOf(() => undefined))).rejects.toThrow('沒有任何檔案');
    const big = await zipOf((z) => {
      z.file('big.txt', 'x'.repeat(MAX_KIT_BYTES + 1));
    });
    await expect(parseKit(big)).rejects.toThrow('上限');
  });
});
