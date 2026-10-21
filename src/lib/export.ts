import { triageBin } from './scoring';
import type { Owned, ScenarioEntry, WishBin, WishEntry } from './types';

const BOM = '\uFEFF';

const HEADER = ['類型', '內容', '檔案', '預期效益', '會重複發生', '規則寫得出來', '有來源可驗證', '分類', '姓名'];

const BIN_LABEL: Record<WishBin, string> = {
  now: '現在就能做',
  build: '請人協助建置',
  learn: '你可以學',
};

function quote(cell: string): string {
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function yesNo(value: boolean): string {
  return value ? '是' : '否';
}

export function toCsv(rows: string[][]): string {
  return BOM + rows.map((row) => row.map(quote).join(',')).join('\r\n');
}

export function exportRows(
  wish: Owned<WishEntry>[],
  scenarios: Owned<ScenarioEntry>[],
  names: Record<string, string>,
): string[][] {
  const nameFor = (uid: string, optIn: boolean) => (optIn ? (names[uid] ?? '') : '');
  const rows: string[][] = [HEADER];
  for (const { uid, value } of wish) {
    for (const item of value.items) {
      rows.push([
        '願望清單',
        item.text,
        '',
        '',
        yesNo(item.repeats),
        yesNo(item.rulesWritable),
        yesNo(item.sourceCheckable),
        BIN_LABEL[triageBin(item)],
        nameFor(uid, item.optInName),
      ]);
    }
  }
  for (const { uid, value } of scenarios) {
    rows.push(['情境', value.what, value.files, value.gain, '', '', '', '', nameFor(uid, value.optInName)]);
  }
  return rows;
}
