import { describe, expect, test } from 'vitest';
import { exportRows, toCsv } from '../../src/lib/export';
import type { Owned, ScenarioEntry, WishEntry } from '../../src/lib/types';

describe('toCsv', () => {
  test('starts with BOM and quotes cells containing commas', () => {
    const csv = toCsv([['名稱', 'a,b']]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"a,b"');
  });
  test('escapes quotes and quotes cells with newlines', () => {
    expect(toCsv([['say "hi"', 'x\ny']])).toBe('\uFEFF"say ""hi""","x\ny"');
  });
  test('joins rows with CRLF', () => {
    expect(toCsv([['a'], ['b']])).toBe('\uFEFFa\r\nb');
  });
});

const wish = (uid: string, optInName: boolean): Owned<WishEntry> => ({
  uid,
  value: {
    items: [{ text: '整理新聞稿', repeats: true, rulesWritable: true, sourceCheckable: true, optInName }],
  },
});

describe('exportRows', () => {
  const names = { u1: '王小明', u2: '李小華' };

  test('first row is the header', () => {
    expect(exportRows([], [], names)[0]).toEqual([
      '類型', '內容', '檔案', '預期效益', '會重複發生', '規則寫得出來', '有來源可驗證', '分類', '姓名',
    ]);
  });
  test('opted-out wish item has empty name even when names has the uid', () => {
    const row = exportRows([wish('u1', false)], [], names)[1];
    expect(row?.[8]).toBe('');
  });
  test('opted-in wish item gets the name', () => {
    const row = exportRows([wish('u2', true)], [], names)[1];
    expect(row).toEqual(['願望清單', '整理新聞稿', '', '', '是', '是', '是', '請人協助建置', '李小華']);
  });
  test('opted-in item with no stored name has empty name cell', () => {
    expect(exportRows([wish('u3', true)], [], names)[1]?.[8]).toBe('');
  });
  test('wish bin labels follow the triage rule', () => {
    const entry: Owned<WishEntry> = {
      uid: 'u1',
      value: {
        items: [
          { text: 'a', repeats: false, rulesWritable: true, sourceCheckable: true, optInName: false },
          { text: 'b', repeats: true, rulesWritable: false, sourceCheckable: true, optInName: false },
        ],
      },
    };
    const rows = exportRows([entry], [], names);
    expect(rows[1]?.[7]).toBe('現在就能做');
    expect(rows[2]?.[7]).toBe('你可以學');
    expect(rows[2]?.slice(4, 7)).toEqual(['是', '否', '是']);
  });
  test('scenario rows fill 工作, 檔案, 預期效益 and honour opt-in', () => {
    const on: Owned<ScenarioEntry> = { uid: 'u1', value: { what: '報帳', files: 'xlsx', gain: '省時', optInName: true } };
    const off: Owned<ScenarioEntry> = { uid: 'u2', value: { what: '寫稿', files: 'docx', gain: '準確', optInName: false } };
    const rows = exportRows([], [on, off], names);
    expect(rows[1]).toEqual(['情境', '報帳', 'xlsx', '省時', '', '', '', '', '王小明']);
    expect(rows[2]).toEqual(['情境', '寫稿', 'docx', '準確', '', '', '', '', '']);
  });
});
